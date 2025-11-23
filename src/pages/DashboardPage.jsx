import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <h1 className="dashboard-title">
          Welcome back, <span className="gradient-text">{currentUser.name}!</span>
        </h1>
        <p className="dashboard-subtitle">
          Your emotion-based music journey starts here
        </p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3 className="card-title">🎥 Camera Detection</h3>
            <p className="card-description">
              Enable your camera for real-time emotion detection
            </p>
            <button className="btn btn--primary">Enable Camera</button>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title">🎵 Your Playlists</h3>
            <p className="card-description">
              Browse and manage your mood-based playlists
            </p>
            <button className="btn btn--secondary">View Playlists</button>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title">📊 Mood History</h3>
            <p className="card-description">
              Track your emotional patterns over time
            </p>
            <button className="btn btn--secondary">View History</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
