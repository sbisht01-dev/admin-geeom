import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebaseConfig'; // Adjust path if needed
import { ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { ref, onValue, set, remove, update } from "firebase/database";
import "./AdminDocs.css";

const AdminDocs = () => {
    const [file, setFile] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    // --- 1. Fetch Documents (Real-time) ---
    useEffect(() => {
        const docsRef = ref(db, 'site_documents');
        const unsubscribe = onValue(docsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const docList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort by newest first
                setDocuments(docList.reverse());
            } else {
                setDocuments([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- 2. Handle File Selection ---
    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // --- 3. Upload File ---
    const handleUpload = () => {
        if (!file) return alert("Please select a file first!");

        setIsUploading(true);
        // Create a unique file name
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
                // Upload Complete: Get URL and Save to DB
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    const newDocRef = ref(db, `site_documents/${Date.now()}`);
                    
                    set(newDocRef, {
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: (file.size / 1024).toFixed(2) + " KB",
                        uploadedAt: new Date().toLocaleString(),
                        isVisible: true, // Default to visible
                        storagePath: `documents/${fileName}` // Saved for deletion later
                    })
                    .then(() => {
                        setIsUploading(false);
                        setFile(null);
                        setUploadProgress(0);
                        alert("File uploaded successfully!");
                        // Reset input
                        document.getElementById('fileInput').value = "";
                    });
                });
            }
        );
    };

    // --- 4. Toggle Visibility ---
    const toggleVisibility = (docId, currentStatus) => {
        update(ref(db, `site_documents/${docId}`), {
            isVisible: !currentStatus
        });
    };

    // --- 5. Delete Document ---
    const deleteDocument = (docId, storagePath) => {
        if(!window.confirm("Are you sure? This cannot be undone.")) return;

        // 1. Delete from Storage
        const fileRef = sRef(storage, storagePath);
        deleteObject(fileRef).then(() => {
            // 2. Delete from Database
            remove(ref(db, `site_documents/${docId}`))
                .then(() => alert("Document deleted."))
                .catch((err) => alert("Error removing from DB: " + err.message));
        }).catch((error) => {
            console.error("Error deleting file:", error);
            alert("Error deleting file from storage. It might not exist.");
            // Force remove from DB even if storage delete fails
            remove(ref(db, `site_documents/${docId}`));
        });
    };

    return (
        <div className="admin-docs-container">
            <h1 className="admin-title">Document Manager</h1>

            {/* --- Upload Section --- */}
            <div className="upload-card">
                <h3>Upload New Document</h3>
                <div className="upload-controls">
                    <input 
                        type="file" 
                        id="fileInput" 
                        onChange={handleFileChange} 
                        className="file-input"
                    />
                    <button 
                        onClick={handleUpload} 
                        disabled={isUploading || !file}
                        className="upload-btn"
                    >
                        {isUploading ? `Uploading ${uploadProgress}%` : "Upload File"}
                    </button>
                </div>
                {isUploading && (
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{width: `${uploadProgress}%`}}></div>
                    </div>
                )}
            </div>

            {/* --- Documents List --- */}
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
                                            <small>Date: {doc.uploadedAt}</small>
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