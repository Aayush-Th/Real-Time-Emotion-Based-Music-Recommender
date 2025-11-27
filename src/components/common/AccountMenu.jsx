import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AccountMenu.css';

const AccountMenu = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  
  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <div className="account-menu-wrapper" ref={menuRef}>
      <button 
        className="account-menu-avatar"
        onClick={() => setOpen(!open)}
        aria-label="Account Menu"
      >
        <span className="account-avatar-icon">☰</span>
      </button>
      {open && (
        <div className="account-dropdown">
          <div className="dropdown-header">
            <div className="account-initials">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="account-name">{currentUser.name}</div>
              <div className="account-email">{currentUser.email}</div>
            </div>
          </div>
          <ul className="dropdown-list">
            <li onClick={() => {navigate('/history'); setOpen(false);}}>User History</li>
            <li onClick={() => {navigate('/profile'); setOpen(false);}}>Profile</li>
            <li onClick={() => {navigate('/about'); setOpen(false);}}>About</li>
            <li onClick={handleLogout} className="logout-btn">Logout</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
