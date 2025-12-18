import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="app-footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <h3>MoodTunes</h3>
        <p>
          AI-powered, emotion-based music recommendations that adapt to how you feel
          in real time.
        </p>
      </div>

      <div className="footer-columns">
        <div className="footer-column">
          <h4>Product</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#cta">Get started</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Contact</h4>
          <ul>
            <li>
              <a href="mailto:youremail@example.com">
                youremail@example.com
              </a>
            </li>
            <li>India</li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Connect</h4>
          <ul>
            <li>
              <a href="https://github.com/your-github" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/your-linkedin" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} MoodTunes. All rights reserved.</span>
    </div>
  </footer>
);

export default Footer;
