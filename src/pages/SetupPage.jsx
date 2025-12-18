import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SetupPage.css';

const SetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [region, setRegion] = useState('IN');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch history on component mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (!user?.email) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/history?email=${encodeURIComponent(user.email)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setHistory(data.records || []);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.email]);

  const handleStart = () => {
    // Navigate to experience page (emotion detection)
    navigate('/experience', {
      state: { language, region },
    });
  };

  const handleHistoryClick = (record) => {
    // Navigate to experience with pre-filled data
    navigate('/experience', {
      state: { 
        language: record.language || language,
        region: record.region || region,
        previousRecord: record 
      },
    });
  };

  return (
    <main className="setup-page">
      <div className="setup-container">
        <section className="setup-card">
          <div className="setup-header">
            <h1 className="setup-title">Personalize Your Experience</h1>
            <p className="setup-subtitle">
              Choose your language and region, then detect your emotion for perfect music recommendations.
            </p>
          </div>

          <div className="setup-content">
            <div className="preferences-section">
              <h2 className="section-title">Your Preferences</h2>
              
              <div className="setup-field">
                <label htmlFor="language">Language</label>
                <select 
                  id="language"
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="setup-select"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="hi">🇮🇳 Hindi</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="pt">🇵🇹 Portuguese</option>
                </select>
              </div>

              <div className="setup-field">
                <label htmlFor="region">Region</label>
                <select 
                  id="region"
                  value={region} 
                  onChange={(e) => setRegion(e.target.value)}
                  className="setup-select"
                >
                  <option value="IN">🇮🇳 India</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="AU">🇦🇺 Australia</option>
                  <option value="DE">🇩🇪 Germany</option>
                </select>
              </div>

              <button 
                className="btn btn--primary btn--large setup-start-btn" 
                onClick={handleStart}
              >
                <span>Start Emotion Detection</span>
                <span className="btn-icon">→</span>
              </button>
            </div>

            {user?.email && (
              <div className="history-section">
                <h2 className="section-title">
                  Your History
                  {history.length > 0 && <span className="history-count">{history.length}</span>}
                </h2>
                
                {loading ? (
                  <div className="history-loading">
                    <p>Loading your history...</p>
                  </div>
                ) : error ? (
                  <div className="history-error">
                    <p>{error}</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="history-empty">
                    <p>No emotion records yet. Start detecting emotions to build your history!</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {history.map((record, index) => (
                      <div 
                        key={record._id || index} 
                        className="history-item"
                        onClick={() => handleHistoryClick(record)}
                      >
                        <div className="history-emotion">
                          <span className="emotion-badge">{getEmotionEmoji(record.detected_emotion)}</span>
                          <div className="emotion-info">
                            <p className="emotion-name">
                              {record.detected_emotion.charAt(0).toUpperCase() + record.detected_emotion.slice(1)}
                            </p>
                            <p className="emotion-confidence">
                              Confidence: {(record.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="history-meta">
                          <p className="meta-region">{record.region}</p>
                          <p className="meta-time">
                            {new Date(record.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

// Helper function to get emoji for emotion
const getEmotionEmoji = (emotion) => {
  const emojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fear: '😨',
    disgust: '🤢',
    surprise: '😲',
    neutral: '😐',
  };
  return emojis[emotion] || '😐';
};

export default SetupPage;
