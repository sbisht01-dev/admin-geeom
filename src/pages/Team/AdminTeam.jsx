import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebaseConfig'; // Adjust path if needed
import { ref, onValue, set, remove, update } from "firebase/database";
import { ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import './AdminTeam.css';

// --- Icons ---
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const DeleteIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const LinkedInIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077b5" stroke="none"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>;

const AdminTeam = () => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State (Added 'linkedin' field)
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null); 
    const [formData, setFormData] = useState({
        name: '', role: '', bio: '', creds: '', linkedin: '', image_url: '', storagePath: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // 1. Fetch Team Members
    useEffect(() => {
        const teamRef = ref(db, 'team_members');
        const unsubscribe = onValue(teamRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const teamList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setTeam(teamList);
            } else {
                setTeam([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Handle Form Changes
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) setImageFile(e.target.files[0]);
    };

    // 3. Prepare Edit Mode
    const openEdit = (member) => {
        setIsEditing(true);
        setCurrentId(member.id);
        // Ensure linkedin property exists even if old data doesn't have it
        setFormData({ ...member, linkedin: member.linkedin || '' }); 
        setImageFile(null); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        // Reset linkedin to empty string
        setFormData({ name: '', role: '', bio: '', creds: '', linkedin: '', image_url: '', storagePath: '' });
        setImageFile(null);
        setUploadProgress(0);
    };

    // 4. Save (Add or Update)
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        let downloadURL = formData.image_url;
        let storagePath = formData.storagePath;

        // A. Handle Image Upload
        if (imageFile) {
            if (isEditing && formData.storagePath) {
                try {
                    const oldRef = sRef(storage, formData.storagePath);
                    await deleteObject(oldRef).catch(err => console.log("Old image not found", err));
                } catch (error) { /* ignore */ }
            }

            const fileName = `${Date.now()}_${imageFile.name}`;
            const fileRef = sRef(storage, `team-images/${fileName}`);
            const uploadTask = uploadBytesResumable(fileRef, imageFile);

            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => reject(error),
                    async () => {
                        downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        storagePath = `team-images/${fileName}`;
                        resolve();
                    }
                );
            });
        }

        // B. Save to Database
        const memberData = {
            ...formData,
            image_url: downloadURL,
            storagePath: storagePath || '' 
        };

        try {
            if (isEditing && currentId) {
                await update(ref(db, `team_members/${currentId}`), memberData);
                alert("Team member updated!");
            } else {
                const newId = `member_${Date.now()}`;
                await set(ref(db, `team_members/${newId}`), memberData);
                alert("New member added!");
            }
            resetForm();
        } catch (error) {
            console.error("Error saving:", error);
            alert("Failed to save data.");
        } finally {
            setIsSaving(false);
        }
    };

    // 5. Delete Member
    const handleDelete = async (member) => {
        if(!window.confirm(`Are you sure you want to remove ${member.name}?`)) return;

        if (member.storagePath) {
            const imgRef = sRef(storage, member.storagePath);
            await deleteObject(imgRef).catch(err => console.log("Image delete skipped", err));
        }

        await remove(ref(db, `team_members/${member.id}`));
    };

    return (
        <div className="admin-team-wrapper">
            <h2 className="admin-section-title">Team Management</h2>

            <div className="team-form-card">
                <h3>{isEditing ? `Edit Member: ${formData.name}` : "Add New Team Member"}</h3>
                
                <form onSubmit={handleSave}>
                    <div className="form-grid">
                        
                        {/* Image Upload Area */}
                        <div className="form-group photo-upload">
                            <label>Profile Photo</label>
                            <div className="photo-preview-box">
                                <input type="file" onChange={handleImageChange} accept="image/*" />
                                {imageFile ? (
                                    <img src={URL.createObjectURL(imageFile)} alt="Preview" />
                                ) : formData.image_url ? (
                                    <img src={formData.image_url} alt="Current" />
                                ) : (
                                    <div className="placeholder-icon">📷</div>
                                )}
                            </div>
                        </div>

                        {/* Text Inputs */}
                        <div className="text-inputs">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Sarah Smith" />
                            </div>
                            
                            <div className="form-group">
                                <label>Job Role / Title</label>
                                <input name="role" value={formData.role} onChange={handleInputChange} required placeholder="e.g. Senior Advisor" />
                            </div>

                            <div className="form-group">
                                <label>Qualifications (Creds)</label>
                                <input name="creds" value={formData.creds} onChange={handleInputChange} placeholder="e.g. MBA, CFA" />
                            </div>

                            {/* --- NEW LINKEDIN INPUT --- */}
                            <div className="form-group">
                                <label>LinkedIn URL</label>
                                <input 
                                    name="linkedin" 
                                    value={formData.linkedin} 
                                    onChange={handleInputChange} 
                                    placeholder="https://linkedin.com/in/..." 
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Short Bio</label>
                                <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="3" placeholder="Brief description..." />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        {isEditing && (
                            <button type="button" onClick={resetForm} className="cancel-btn">Cancel Edit</button>
                        )}
                        <button type="submit" className="save-btn" disabled={isSaving}>
                            {isSaving ? `Saving ${Math.round(uploadProgress)}%...` : (isEditing ? "Update Member" : "Add Member")}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- Team List Display --- */}
            <div className="team-list-section">
                <h3>Current Team ({team.length})</h3>
                
                {loading ? <p>Loading team...</p> : team.length === 0 ? <p className="empty-msg">No team members found.</p> : (
                    <div className="team-grid">
                        {team.map(member => (
                            <div key={member.id} className="admin-team-card">
                                <div className="card-img">
                                    {member.image_url ? <img src={member.image_url} alt={member.name} /> : <div className="no-img">No Img</div>}
                                </div>
                                <div className="card-info">
                                    <h4>
                                        {member.name} 
                                        {/* Show LinkedIn Icon if link exists */}
                                        {member.linkedin && (
                                            <a href={member.linkedin} target="_blank" rel="noreferrer" title="View LinkedIn" style={{display: 'flex', alignItems: 'center'}}>
                                                <LinkedInIcon />
                                            </a>
                                        )}
                                    </h4>
                                    <div className="meta-row">
                                        <p className="card-role">{member.role}</p>
                                        {member.creds && <span className="card-creds">{member.creds}</span>}
                                    </div>
                                    <p className="card-bio">{member.bio}</p>
                                </div>
                                <div className="card-actions">
                                    <button onClick={() => openEdit(member)} className="icon-btn edit">
                                        <EditIcon />
                                    </button>
                                    <button onClick={() => handleDelete(member)} className="icon-btn delete">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTeam;