import React from 'react';
import { Menu, X, Settings } from 'lucide-react';
import './Header.css'; // Keep using your existing CSS

const AdminHeader = ({ isOpen, onToggle }) => {
  return (
    <header className="admin-header">
      <div className="header-content">
        <div className="header-left">
          {/* Mobile Menu Button - Triggers the parent's state change */}
          <button onClick={onToggle} className="mobile-toggle">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Logo Area */}
          <div className="brand-container">
            <div className="brand-icon">
              <Settings size={20} />
            </div>
            <div className="brand-text">
              <h1>Admin Portal</h1>
              <p>Manage your company's content</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="user-info">
            <p className="user-name">Admin User</p>
            <p className="user-email">admin@company.com</p>
          </div>
          <div className="user-avatar">
            A
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;