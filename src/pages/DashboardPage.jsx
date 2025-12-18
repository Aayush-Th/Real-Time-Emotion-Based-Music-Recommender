import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EmotionDetector from '../components/emotion/EmotionDetector';
import './DashboardPage.css';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [lang, setLang] = React.useState('en');
  const [region, setRegion] = React.useState('IN');
  const [emotion, setEmotion] = React.useState('neutral');
  const [recs, setRecs] = React.useState([]);
  const [loadingRecs, setLoadingRecs] = React.useState(false);
  const [recsError, setRecsError] = React.useState('');
  const [extraInfo, setExtraInfo] = React.useState('');
  const [generatedParams, setGeneratedParams] = React.useState(null);
  const [genLoading, setGenLoading] = React.useState(false);
  const [genError, setGenError] = React.useState('');

  React.useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const fetchRecs = async () => {
    setLoadingRecs(true);
    setRecsError('');
    try {
      const q = new URLSearchParams({ emotion, language: lang, region, limit: 12 });
      const res = await fetch(`/api/recommendations?${q.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Recommendation failed (${res.status})`);
      }
      const data = await res.json();
      setRecs(data.tracks || []);
    } catch (err) {
      setRecsError(err.message || 'Failed to fetch recommendations');
      setRecs([]);
    } finally {
      setLoadingRecs(false);
    }
  };

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
            <h3 className="card-title">🎵 Language-based Recommendations</h3>
            <p className="card-description">
              Get song suggestions from Spotify based on the language you select.
            </p>

            <div className="controls-row">
              <label style={{ fontWeight: 600 }}>Language</label>
              <select value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
              </select>

              <label style={{ fontWeight: 600 }}>Emotion</label>
              <select value={emotion} onChange={(e) => setEmotion(e.target.value)}>
                <option value="neutral">Neutral</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="angry">Angry</option>
                <option value="surprise">Surprise</option>
                <option value="fear">Fear</option>
                <option value="disgust">Disgust</option>
              </select>
            </div>

            <div className="controls-row">
              <input value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} placeholder="Extra info (e.g. energetic, acoustic)" style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid var(--color-border)' }} />
              <button className="btn btn--primary" onClick={fetchRecs} disabled={loadingRecs}>
                {loadingRecs ? 'Fetching...' : 'Get Songs'}
              </button>
              <button className="btn btn--secondary" onClick={() => { window.location.href = '/auth/login'; }}>
                Connect Spotify
              </button>
            </div>

            <div className="controls-row">
              <button className="btn btn--primary" onClick={async () => {
                setGenLoading(true);
                setGenError('');
                setGeneratedParams(null);
                try {
                  const res = await fetch('/api/ai/generate_params', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emotion, language: lang, extra_info: extraInfo }),
                    credentials: 'include'
                  });
                  if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    throw new Error(d.error || `Generation failed (${res.status})`);
                  }
                  const data = await res.json();
                  setGeneratedParams(data);
                } catch (err) {
                  setGenError(err.message || 'Failed to generate params');
                } finally {
                  setGenLoading(false);
                }
              }} disabled={genLoading}>{genLoading ? 'Generating...' : 'Generate Params'}</button>

              <button className="btn btn--secondary" onClick={() => {
                // use generated params if available
                if (!generatedParams) return;
                const q = new URLSearchParams({ seed_genres: (Array.isArray(generatedParams.seed_genres) ? generatedParams.seed_genres.join(',') : generatedParams.seed_genres), market: generatedParams.market || 'US', limit: 12 });
                (async () => {
                  setLoadingRecs(true); setRecsError('');
                  try {
                    const r = await fetch(`/api/recommendations?${q.toString()}`, { credentials: 'include' });
                    if (!r.ok) { const d = await r.json().catch(()=>({})); throw new Error(d.error || `Fetch failed (${r.status})`); }
                    const d = await r.json(); setRecs(d.tracks || []);
                  } catch (err) { setRecsError(err.message || 'Failed to fetch'); setRecs([]); }
                  setLoadingRecs(false);
                })();
              }} disabled={!generatedParams}>Use Generated Params</button>
            </div>

            {genError && <div className="error-message">{genError}</div>}

            {recsError && <div className="error-message">{recsError}</div>}

            <div style={{ marginTop: '1rem' }}>
              {recs.length === 0 ? (
                <p className="card-description">No recommendations yet. Click Get Songs to fetch.</p>
              ) : (
                <div className="emotion-detector__track-grid">
                  {recs.map((track, i) => (
                    <a key={track.id || i} href={track.external_url} target="_blank" rel="noreferrer" className="emotion-detector__track-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'var(--color-surface)', marginBottom: '0.5rem' }}>
                      {track.album_image && (
                        <div className="emotion-detector__track-art" style={{ width: 64, height: 64, backgroundSize: 'cover', backgroundImage: `url(${track.album_image})` }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{track.name}</div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>{track.artists}</div>
                      </div>
                      <div>
                        {track.external_url && <span>🎧</span>}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <h3 className="card-title">📊 Mood History</h3>
            <p className="card-description">
              Track your emotional patterns over time
            </p>
            <button className="btn btn--secondary">View History</button>
          </div>
        </div>

        <div className="dashboard-detector">
          <EmotionDetector />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
