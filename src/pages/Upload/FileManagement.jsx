import React, { useState, useEffect } from 'react';
import { 
  ref as dbRef, 
  push, 
  onValue, 
  update, 
  remove 
} from "firebase/database";
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { db, storage } from '../../firebase'; // Adjust path as needed
import { FileText, Trash2, UploadCloud, Loader2 } from 'lucide-react';
import './FileManagement.css';

const FileManagement = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    fileName: '',
    category: '',
    description: '',
    file: null
  });

  // --- 1. FETCH DATA (Realtime Listener) ---
  useEffect(() => {
    setLoading(true);
    const filesRef = dbRef(db, 'files/');
    
    // onValue creates a realtime listener
    const unsubscribe = onValue(filesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object of objects into an array
        const fileList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by newest first
        setFiles(fileList.reverse());
      } else {
        setFiles([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. HANDLE INPUT CHANGES ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  // --- 3. UPLOAD LOGIC ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file || !formData.fileName || !formData.category) {
      alert("Please fill in all required fields.");
      return;
    }

    setUploadProgress(true);

    try {
      // A. Upload file to Firebase Storage
      const fileRef = storageRef(storage, `uploads/${Date.now()}_${formData.file.name}`);
      const snapshot = await uploadBytes(fileRef, formData.file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // B. Prepare Metadata
      const newFileEntry = {
        name: formData.fileName,
        category: formData.category,
        description: formData.description,
        size: (formData.file.size / (1024 * 1024)).toFixed(2) + ' MB', // Convert to MB
        uploadDate: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
        fileUrl: downloadURL,
        showOnSite: true, // Default to true
        storagePath: snapshot.metadata.fullPath // Saved to delete later if needed
      };

      // C. Push Metadata to Realtime DB
      await push(dbRef(db, 'files/'), newFileEntry);

      // D. Reset Form
      setFormData({
        fileName: '',
        category: '',
        description: '',
        file: null
      });
      // Clear the file input visually
      document.getElementById('file-input').value = ""; 
      
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Upload failed. Check console.");
    } finally {
      setUploadProgress(false);
    }
  };

  // --- 4. TOGGLE VISIBILITY ---
  const toggleShowOnSite = (fileId, currentStatus) => {
    const fileRef = dbRef(db, `files/${fileId}`);
    update(fileRef, {
      showOnSite: !currentStatus
    });
  };

  // --- 5. DELETE FILE ---
  const deleteFile = async (fileId) => {
    if(window.confirm("Are you sure you want to delete this file log?")) {
      // Note: For a full delete, you should also delete from Storage using the storagePath
      // Here we are just removing the DB entry for the UI.
      const fileRef = dbRef(db, `files/${fileId}`);
      await remove(fileRef);
    }
  };

  return (
    <div className="file-management-container">
      <div className="page-header">
        <h2>File Management</h2>
        <p>Upload and manage your documents and files</p>
      </div>

      {/* --- UPLOAD CARD --- */}
      <div className="card upload-card">
        <h3>Upload New File</h3>
        <form onSubmit={handleUpload}>
          <div className="form-row">
            <div className="form-group">
              <label>File Name *</label>
              <input 
                type="text" 
                name="fileName"
                placeholder="e.g., Company Brochure"
                value={formData.fileName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleInputChange}
              >
                <option value="">Select category</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Technical">Technical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description"
              placeholder="Brief description of the file"
              rows="3"
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
          </div>

          <div className="form-group">
            <label>Select File *</label>
            <div className="file-input-wrapper">
              <input 
                id="file-input"
                type="file" 
                onChange={handleFileChange}
                className="hidden-input"
              />
              <div className="custom-file-display">
                {formData.file ? formData.file.name : "Browse... No file selected."}
              </div>
              <button 
                type="submit" 
                className="upload-btn" 
                disabled={uploadProgress}
              >
                {uploadProgress ? (
                   <Loader2 className="animate-spin" size={18} /> 
                ) : (
                   <><UploadCloud size={18} /> Upload</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* --- TABLE CARD --- */}
      <div className="card table-card">
        <h3>Uploaded Files ({files.length})</h3>
        
        <div className="table-responsive">
          <table className="files-table">
            <thead>
              <tr>
                <th>FILE NAME</th>
                <th>DESCRIPTION</th>
                <th>CATEGORY</th>
                <th>SIZE</th>
                <th>UPLOAD DATE</th>
                <th className="text-center">SHOW ON SITE</th>
                <th className="text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center">Loading data...</td></tr>
              ) : files.map((file) => (
                <tr key={file.id}>
                  <td>
                    <div className="file-info-cell">
                      <FileText className="file-icon-blue" size={20} />
                      <div>
                        <a href={file.fileUrl} target="_blank" rel="noreferrer" className="file-link">
                          {file.name}
                        </a>
                        <span className="file-sub-text">{file.storagePath?.split('/').pop()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="desc-cell">{file.description}</td>
                  <td>
                    <span className={`badge badge-${file.category.toLowerCase()}`}>
                      {file.category}
                    </span>
                  </td>
                  <td>{file.size}</td>
                  <td>{file.uploadDate}</td>
                  <td className="text-center">
                    {/* TOGGLE SWITCH */}
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={file.showOnSite} 
                        onChange={() => toggleShowOnSite(file.id, file.showOnSite)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                  <td className="text-center">
                    <button 
                      className="delete-btn"
                      onClick={() => deleteFile(file.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {!loading && files.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-gray-500">
                    No files found. Upload one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FileManagement;