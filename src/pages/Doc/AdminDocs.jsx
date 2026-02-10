import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebaseConfig'; // Adjust path as needed
import { ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { ref, onValue, set, remove, update } from "firebase/database";
import './AdminDocs.css';

// --- Icons ---
const CloudIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>
);

const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const AdminDocs = () => {
    // --- Document States ---
    const [file, setFile] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // --- Logo States ---
    const [logoFile, setLogoFile] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);
    const [logoProgress, setLogoProgress] = useState(0);
    const [isLogoUploading, setIsLogoUploading] = useState(false);

    // --- 1. Fetch Data (Docs & Logo) ---
    useEffect(() => {
        // Fetch Documents
        const docsRef = ref(db, 'site_documents');
        const unsubDocs = onValue(docsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const docList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setDocuments(docList.reverse());
            } else {
                setDocuments([]);
            }
        });

        // Fetch Current Logo
        const logoRef = ref(db, 'site_identity/logo_url');
        const unsubLogo = onValue(logoRef, (snapshot) => {
            const url = snapshot.val();
            if (url) setCurrentLogo(url);
        });

        return () => {
            unsubDocs();
            unsubLogo();
        };
    }, []);

    // --- 2. Document Handlers ---
    const handleFileChange = (e) => {
        if (e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file) return;
        setIsUploading(true);
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = sRef(storage, `documents/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(Math.round(progress));
            }, 
            (error) => {
                console.error("Upload Error: ", error);
                setIsUploading(false);
                alert("Upload failed.");
            }, 
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    const newDocRef = ref(db, `site_documents/${Date.now()}`);
                    set(newDocRef, {
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: (file.size / 1024).toFixed(2) + " KB",
                        uploadedAt: new Date().toLocaleString(),
                        isVisible: true,
                        storagePath: `documents/${fileName}`
                    }).then(() => {
                        setIsUploading(false);
                        setFile(null);
                        setUploadProgress(0);
                        alert("File uploaded successfully!");
                    });
                });
            }
        );
    };

    const toggleVisibility = (docId, currentStatus) => {
        update(ref(db, `site_documents/${docId}`), { isVisible: !currentStatus });
    };

    const deleteDocument = (docId, storagePath) => {
        if(!window.confirm("Delete this document?")) return;
        const fileRef = sRef(storage, storagePath);
        deleteObject(fileRef)
            .then(() => remove(ref(db, `site_documents/${docId}`)))
            .catch(() => remove(ref(db, `site_documents/${docId}`))); 
    };

    // --- 3. Logo Handlers ---
    const handleLogoSelect = (e) => {
        if (e.target.files[0]) setLogoFile(e.target.files[0]);
    };

    const handleLogoUpload = () => {
        if (!logoFile) return;
        setIsLogoUploading(true);
        
        // We use a timestamp to avoid caching issues with the same filename
        const fileName = `site_logo_${Date.now()}`; 
        const logoStorageRef = sRef(storage, `site_assets/${fileName}`);
        const uploadTask = uploadBytesResumable(logoStorageRef, logoFile);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setLogoProgress(Math.round(progress));
            },
            (error) => {
                console.error("Logo Upload Error:", error);
                setIsLogoUploading(false);
                alert("Logo upload failed.");
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    // Update Database with new URL
                    set(ref(db, 'site_identity/logo_url'), downloadURL)
                    .then(() => {
                        setIsLogoUploading(false);
                        setLogoFile(null);
                        setLogoProgress(0);
                        alert("Site Logo Updated!");
                    });
                });
            }
        );
    };

    return (
        <div className="admin-docs-container">
            <h2 className="admin-title">Document & Brand Manager</h2>

  <div className="logo-section">
                <h3 className="section-label">Site Logo</h3>
                <div className="logo-grid">
                    
                    {/* Left: Preview */}
                    <div className="logo-preview-container">
                        <span className="logo-sub-label">Current Logo</span>
                        <div className="logo-box">
                            {currentLogo ? (
                                <img src={currentLogo} alt="Site Logo" className="logo-img" />
                            ) : (
                                <div className="logo-placeholder">No Logo Set</div>
                            )}
                        </div>
                    </div>

                    {/* Right: Upload Control */}
                    <div className="logo-upload-control">
                        <span className="logo-sub-label">Update Logo</span>
                        <div className="mini-upload-box">
                            <input type="file" id="logoInput" onChange={handleLogoSelect} accept="image/*" />
                            <label htmlFor="logoInput" className="mini-upload-label">
                                {logoFile ? (
                                    <span className="selected-file-text">📸 {logoFile.name}</span>
                                ) : (
                                    <>
                                        <ImageIcon />
                                        <span>Select Image</span>
                                    </>
                                )}
                            </label>
                        </div>
                        
                        {logoFile && (
                             <button 
                                onClick={handleLogoUpload} 
                                className="logo-save-btn"
                                disabled={isLogoUploading}
                             >
                                {isLogoUploading ? `Uploading ${logoProgress}%` : "Save Logo"}
                             </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="upload-section">

                <h3 className="section-label">Upload New Document</h3>
                <div 
                    className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input 
                        type="file" 
                        id="fileInput" 
                        onChange={handleFileChange} 
                        className="hidden-input" 
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx" 
                    />
                    
                    {!file ? (
                        <label htmlFor="fileInput" className="drop-label">
                            <div className="icon-bg"><CloudIcon /></div>
                            <p className="primary-text">Click to upload or drag and drop</p>
                            <p className="secondary-text">PDF, DOC, PNG, JPG (max 10MB)</p>
                        </label>
                    ) : (
                        <div className="file-preview-card">
                            <div className="preview-info">
                                <FileIcon />
                                <div className="preview-text">
                                    <span className="p-name">{file.name}</span>
                                    <span className="p-size">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                            <button className="remove-file-btn" onClick={() => setFile(null)}>✕</button>
                        </div>
                    )}
                </div>

                {file && (
                    <div className="upload-actions">
                        {isUploading ? (
                            <div className="progress-container">
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{width: `${uploadProgress}%`}}></div>
                                </div>
                                <span className="progress-text">{uploadProgress}% Uploading...</span>
                            </div>
                        ) : (
                            <button onClick={handleUpload} className="modern-upload-btn">
                                Upload Document
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="docs-list">
                <h3>Uploaded Documents ({documents.length})</h3>
                 {documents.length === 0 ? (
                    <p className="no-docs">No documents uploaded yet.</p>
                ) : (
                    <div className="responsive-table">
                        <table className="docs-table">
                            <thead>
                                <tr>
                                    <th>File Name</th>
                                    <th>Meta Data</th>
                                    <th>Visibility</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => (
                                    <tr key={doc.id}>
                                        <td>
                                            <div className="file-info">
                                                <span className="file-icon">📄</span>
                                                <a href={doc.url} target="_blank" rel="noreferrer" className="file-link">
                                                    {doc.name}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="meta-cell">
                                            <small>Size: {doc.size}</small><br/>
                                            <small>Date: {doc.uploadedAt ? doc.uploadedAt.split(',')[0] : ''}</small>
                                        </td>
                                        <td>
                                            <button 
                                                className={`toggle-btn ${doc.isVisible ? 'on' : 'off'}`}
                                                onClick={() => toggleVisibility(doc.id, doc.isVisible)}
                                            >
                                                {doc.isVisible ? 'Visible' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => deleteDocument(doc.id, doc.storagePath)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDocs;