import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UploadCloud, Users, HelpCircle } from 'lucide-react';
import './Navbar.css'; // Ensure you have the CSS file for styling

const AdminSidebar = ({ isOpen }) => {
  const location = useLocation();

  // Define navigation links here
  const navigation = [
    { name: 'File Upload', icon: UploadCloud, path: '/admin/overview' },
    { name: 'Contact Information', icon: Users, path: '/admin/contacts' },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-inner">
        {/* Main Navigation */}
        <ul className="nav-list">
          {navigation.map((item) => {
            // Check if this link is currently active based on URL
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
           <div className="support-section">
             <p className="footer-label">Support</p>
             <button className="help-btn">
               <HelpCircle size={18} />
               <span>Help Center</span>
             </button>
           </div>
           
           <div className="mobile-user-info">
              <p>Admin User</p>
              <p>admin@company.com</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;