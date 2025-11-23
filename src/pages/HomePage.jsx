import React from 'react';
import './HomePage.css';

const HomePage = () => {
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            <span>AI-Powered Music Discovery</span>
          </div>
          
          <h1 className="hero-title">
            Music That Understands Your{' '}
            <span className="gradient-text">Emotions</span>
          </h1>
          
          <p className="hero-subtitle">
            Experience real-time emotion detection powered by advanced AI. 
            Get personalized music recommendations that perfectly match your mood and enhance your well-being.
          </p>
          
          <div className="hero-buttons">
            <button className="btn btn--primary btn--large">
              <span>Get Started Free</span>
              <span className="btn-icon">→</span>
            </button>
            <button className="btn btn--secondary btn--large" onClick={scrollToFeatures}>
              <span>Discover Features</span>
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">1M+</div>
              <div className="stat-label">Songs Analyzed</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card card-1">
            <span className="emoji">😊</span>
            <span className="label">Happy</span>
          </div>
          <div className="visual-card card-2">
            <span className="emoji">😢</span>
            <span className="label">Sad</span>
          </div>
          <div className="visual-card card-3">
            <span className="emoji">😌</span>
            <span className="label">Calm</span>
          </div>
          <div className="visual-card card-4">
            <span className="emoji">😎</span>
            <span className="label">Energetic</span>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-badge">Features</span>
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle">
            Powerful features designed to enhance your music listening experience
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">😊</span>
            </div>
            <h3 className="feature-title">Real-Time Detection</h3>
            <p className="feature-description">
              Advanced AI analyzes your facial expressions to detect your current emotional state instantly with 98% accuracy.
            </p>
            <ul className="feature-list">
              <li>✓ Facial recognition technology</li>
              <li>✓ Multiple emotion categories</li>
              <li>✓ Instant processing</li>
            </ul>
          </div>

          <div className="feature-card featured">
            <div className="featured-badge">Most Popular</div>
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🎧</span>
            </div>
            <h3 className="feature-title">Smart Recommendations</h3>
            <p className="feature-description">
              Get curated playlists that perfectly match your mood and enhance your emotional well-being through music therapy.
            </p>
            <ul className="feature-list">
              <li>✓ Personalized playlists</li>
              <li>✓ Genre-diverse selection</li>
              <li>✓ Continuous learning</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">📊</span>
            </div>
            <h3 className="feature-title">Mood Tracking</h3>
            <p className="feature-description">
              Track your emotional patterns over time and discover insights about your music preferences and emotional journey.
            </p>
            <ul className="feature-list">
              <li>✓ Historical data analysis</li>
              <li>✓ Visual mood charts</li>
              <li>✓ Weekly insights</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-header">
          <span className="section-badge">How It Works</span>
          <h2 className="section-title">Three Simple Steps</h2>
        </div>

        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3 className="step-title">Allow Camera Access</h3>
            <p className="step-description">
              Grant permission for the app to access your camera for emotion detection
            </p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3 className="step-title">AI Detects Emotion</h3>
            <p className="step-description">
              Our AI analyzes your facial expressions in real-time to understand your mood
            </p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3 className="step-title">Enjoy Perfect Music</h3>
            <p className="step-description">
              Receive personalized song recommendations that match your current emotion
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Music Experience?</h2>
          <p className="cta-subtitle">
            Join thousands of users who have discovered the power of emotion-based music recommendations
          </p>
          <button className="btn btn--primary btn--large">
            <span>Start Your Journey</span>
            <span className="btn-icon">→</span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
