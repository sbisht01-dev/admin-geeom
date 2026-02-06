import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import { getAuth, signOut } from "firebase/auth"; // Import Firebase Auth methods
import './AdminHome.css';

// --- Import your Admin Components ---
import AdminDocs from '../Doc/AdminDocs'; 
import AdminContact from '../Contact/AdminContact'; 
import AdminTeam from '../Team/AdminTeam';       

// --- Icons (Simple SVGs) ---
const UploadIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const ContactIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const TeamIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const LogoutIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const AdminHome = () => {
  const [activeTab, setActiveTab] = useState('upload'); // Default tab
  const navigate = useNavigate();
  const auth = getAuth();

  // Function to render the correct component based on state
  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <AdminDocs />;
      case 'contact':
        return <AdminContact />;
      case 'team':
        return <AdminTeam />;
      default:
        return <AdminDocs />;
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    // Optional: Add a confirmation dialog
    if (window.confirm("Are you sure you want to log out?")) {
        try {
            await signOut(auth);
            // Redirect to Login page (or Home) after logout
            navigate('/login'); 
        } catch (error) {
            console.error("Error signing out: ", error);
            alert("Logout failed. Please try again.");
        }
    }
  };

  return (
    <div className="admin-layout">
      
      {/* --- Main Content Area --- */}
      <main className="admin-content">
        {renderContent()}
      </main>

      {/* --- Bottom Navigation Bar --- */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`} 
          onClick={() => setActiveTab('upload')}
        >
          <UploadIcon />
          <span>Uploads</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'contact' ? 'active' : ''}`} 
          onClick={() => setActiveTab('contact')}
        >
          <ContactIcon />
          <span>Contact</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'team' ? 'active' : ''}`} 
          onClick={() => setActiveTab('team')}
        >
          <TeamIcon />
          <span>Team</span>
        </button>

        {/* --- Logout Button --- */}
        <button 
          className="nav-item" 
          onClick={handleLogout}
          style={{ color: '#EF4444' }} // Optional: Red color to indicate exit action
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </nav>

    </div>
  );
};

export default AdminHome;