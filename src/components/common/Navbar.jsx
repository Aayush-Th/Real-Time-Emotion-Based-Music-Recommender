import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccountMenu from './AccountMenu';
import LoginModal from '../auth/LoginModal';
import SignupModal from '../auth/SignupModal';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const switchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const switchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Left side: account (hamburger) + brand */}
          <div className="navbar-left">
            <div className="account-area-left">
              {currentUser && (
                <AccountMenu />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/" className="navbar-brand">
                <span className="navbar-brand-icon">🎵</span>
                <span className="navbar-brand-text">MoodTunes</span>
              </Link>
            </div>
          </div>

          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="hamburger"></span>
            <span className="hamburger"></span>
            <span className="hamburger"></span>
          </button>

          <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link to="/" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            {currentUser && (
              <Link to="/dashboard" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            )}
            {currentUser && (
              <Link to="/experience" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                Experience
              </Link>
            )}
            <a href="#features" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>

            {!currentUser && (
              <div className="auth-buttons">
                <button 
                  className="btn btn--secondary" 
                  onClick={() => {
                    setShowLoginModal(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  Login
                </button>
                <button 
                  className="btn btn--primary" 
                  onClick={() => {
                    setShowSignupModal(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={switchToSignup}
      />
      <SignupModal 
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={switchToLogin}
      />
    </>
  );
};

export default Navbar;
