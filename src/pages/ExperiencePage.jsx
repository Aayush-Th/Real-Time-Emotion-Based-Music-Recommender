import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import EmotionDetector from '../components/emotion/EmotionDetector';
import './ExperiencePage.css';

const ExperiencePage = () => {
  const detectorRef = useRef(null);
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state || {};
  
  const [language, setLanguage] = useState(state.language || 'en');
  const [region, setRegion] = useState(state.region || 'IN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectEmotion = async () => {
    if (!detectorRef.current) {
      setError('Detector not initialized');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setIsDetecting(true);

    try {
      // Start camera and capture image
      await detectorRef.current.startCamera();
      const imageData = await detectorRef.current.captureSnapshot();

      if (!imageData) {
        throw new Error('Failed to capture image');
      }

      // Send to backend for emotion detection
      const metadata = {
        email: user?.email,
        name: user?.displayName,
        region,
        language,
      };

      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: imageData,
          metadata,
          limit: 10,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to detect emotion');
      }

      const data = await response.json();
      
      setDetectedEmotion({
        emotion: data.emotion,
        confidence: data.confidence,
      });

      setRecommendations(data.tracks || []);
      setSuccess(`Emotion detected: ${data.emotion} (${(data.confidence * 100).toFixed(1)}%)`);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to detect emotion. Please try again.');
      setDetectedEmotion(null);
      setRecommendations([]);
    } finally {
      // Ensure camera is stopped after detection completes (success or error)
      try {
        if (detectorRef.current && detectorRef.current.stopCamera) {
          await detectorRef.current.stopCamera();
        }
      } catch (stopErr) {
        // ignore stop errors
        console.warn('Failed to stop camera:', stopErr);
      }

      setLoading(false);
      setIsDetecting(false);
    }
  };

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

  return (
    <main className="experience-page">
      <section className="experience-hero">
        <div className="hero-content">
          <span className="section-badge">🎵 Emotion Detection</span>
          <h1 className="hero-title">Detect Your Emotion</h1>
          <p className="hero-subtitle">
            We'll analyze your facial expression and recommend songs that match your mood perfectly.
          </p>
        </div>
      </section>

      <section className="experience-container">
        <div className="experience-card">
          <div className="preferences-panel">
            <h2>Your Preferences</h2>
            
            <div className="pref-field">
              <label htmlFor="language">Language</label>
              <select 
                id="language"
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>

            <div className="pref-field">
              <label htmlFor="region">Region</label>
              <select 
                id="region"
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
              </select>
            </div>
          </div>

          <div className="detector-panel">
            <h2>Capture Your Expression</h2>
            <div className="detector-wrapper">
              <EmotionDetector ref={detectorRef} showControls={false} />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button 
              className="btn btn--primary btn--large detect-btn"
              onClick={handleDetectEmotion}
              disabled={loading}
            >
              {loading ? 'Detecting...' : 'Detect Emotion & Get Recommendations'}
            </button>
          </div>
        </div>
      </section>

      {detectedEmotion && (
        <section className="results-section">
          <div className="emotion-result">
            <div className="emotion-box">
              <span className="emotion-emoji">{getEmotionEmoji(detectedEmotion.emotion)}</span>
              <div className="emotion-details">
                <h3>{detectedEmotion.emotion.charAt(0).toUpperCase() + detectedEmotion.emotion.slice(1)}</h3>
                <p className="confidence">
                  Confidence: <strong>{(detectedEmotion.confidence * 100).toFixed(1)}%</strong>
                </p>
              </div>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="recommendations-box">
              <h2>Recommended Songs</h2>
              <p className="recommendations-subtitle">
                Perfect tracks for your current mood
              </p>
              
              <div className="recommendations-grid">
                {recommendations.map((track, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="track-number">{index + 1}</div>
                    <div className="track-info">
                      <h4 className="track-name">{track.name || 'Unknown Track'}</h4>
                      <p className="track-artist">
                        {track.artists?.join(', ') || 'Unknown Artist'}
                      </p>
                      <p className="track-album">{track.album || 'Unknown Album'}</p>
                    </div>
                    {track.external_urls?.spotify && (
                      <a 
                        href={track.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="spotify-link"
                      >
                        🎵 Listen
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <div className="recommendations-note">
                {recommendations.length > 0 && recommendations[0].external_url?.includes('spotify.com') ? (
                  <p>🎵 <strong>Recommendations from Spotify</strong></p>
                ) : (
                  <p>
                    🎵 <strong>Note:</strong> This is using placeholder data. Connect your Spotify API credentials 
                    in the backend to get real recommendations.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="info-section">
        <div className="info-card">
          <h3>How It Works</h3>
          <ol className="info-steps">
            <li>Select your preferred language and region</li>
            <li>Position your face in front of the camera</li>
            <li>Click "Detect Emotion" to analyze your facial expression</li>
            <li>Receive personalized music recommendations based on your mood</li>
            <li>All your sessions are saved to your history</li>
          </ol>
        </div>
      </section>
    </main>
  );
};

export default ExperiencePage;

