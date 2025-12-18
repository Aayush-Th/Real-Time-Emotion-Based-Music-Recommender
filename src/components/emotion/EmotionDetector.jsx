import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import './EmotionDetector.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const statusLabels = {
  idle: 'Camera is idle',
  ready: 'Camera ready. Capture your mood whenever you are ready.',
  capturing: 'Taking a snapshot...',
  processing: 'Analyzing mood and fetching recommendations...',
  error: 'There was an issue. Check the message above.',
};

const EmotionDetector = forwardRef(
  ({ metadata = {}, limit = 6, onResult, showControls = true }, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [emotion, setEmotion] = useState(null);
    const [confidence, setConfidence] = useState(null);
    const [tracks, setTracks] = useState([]);

    const stopCamera = useCallback(() => {
      if (!stream) return;
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setStatus('idle');
    }, [stream]);

    const startCamera = useCallback(async () => {
      setError('');
      if (stream) {
        setStatus('ready');
        return stream;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        const message = 'Camera access is not supported in this browser.';
        setError(message);
        setStatus('error');
        throw new Error(message);
      }

      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              resolve();
            };
          });
        }
        setStream(userStream);
        setStatus('ready');
        return userStream;
      } catch (err) {
        const message = "Couldn't access the camera. Please allow permissions.";
        setError(message);
        setStatus('error');
        throw err;
      }
    }, [stream]);

    const captureSnapshot = useCallback(async () => {
      if (!videoRef.current || !stream) {
        const message = 'Enable the camera before capturing.';
        setError(message);
        setStatus('error');
        throw new Error(message);
      }

      setError('');
      setStatus('capturing');
      const canvas = canvasRef.current;
      if (!canvas) return;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      setStatus('processing');
      try {
        const response = await fetch(`/api/detect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_data: imageData,
            limit,
            metadata,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to analyse the frame.');
        }

        setEmotion(payload.emotion);
        setConfidence(Math.round((payload.confidence || 0) * 100));
        setTracks(payload.tracks || []);
        setStatus('ready');
        onResult?.(payload);
        return payload;
      } catch (err) {
        setError(err.message);
        setStatus('error');
        throw err;
      }
    }, [stream, metadata, limit, onResult]);

    useImperativeHandle(
      ref,
      () => ({
        startCamera,
        stopCamera,
        captureSnapshot,
      }),
      [startCamera, stopCamera, captureSnapshot]
    );

    useEffect(() => {
      return () => {
        stopCamera();
      };
    }, [stopCamera]);

    return (
      <section className="emotion-detector">
        <div className="emotion-detector__header">
          <div>
            <p className="section-badge">Live Mood Scan</p>
            <h2 className="emotion-detector__title">Capture your current emotion</h2>
          </div>
          <p className="emotion-detector__status">{statusLabels[status]}</p>
        </div>

        <div className="emotion-detector__video-wrapper">
          <video ref={videoRef} autoPlay muted playsInline className="emotion-detector__video" />
          <canvas ref={canvasRef} className="emotion-detector__canvas" />
          {error && <p className="emotion-detector__error">{error}</p>}
        </div>

        {showControls && (
          <div className="emotion-detector__controls">
            <button type="button" className="btn btn--secondary" onClick={startCamera}>
              Enable Camera
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={async () => {
                try {
                  await captureSnapshot();
                } catch (err) {
                  // captureSnapshot already sets the error state; swallow to avoid uncaught exceptions
                }
              }}
              disabled={!stream || status === 'processing'}
            >
              Capture Mood
            </button>
            <button type="button" className="btn btn--ghost" onClick={stopCamera} disabled={!stream}>
              Stop Camera
            </button>
          </div>
        )}

        {emotion && (
          <div className="emotion-detector__result">
            <p>
              Detected emotion: <strong className="gradient-text">{emotion}</strong> (
              {confidence ?? 0}% confidence)
            </p>
          </div>
        )}

        {tracks.length > 0 && (
          <div className="emotion-detector__recommendations">
            <div className="emotion-detector__rec-header">
              <h3>Recommended songs for your mood</h3>
              <p>Tap a card to open it in Spotify.</p>
            </div>
            <div className="emotion-detector__track-grid">
              {tracks.map((track) => (
                <a
                  key={track.id}
                  href={track.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="emotion-detector__track-card"
                >
                  {track.album_image && (
                    <div
                      className="emotion-detector__track-art"
                      style={{ backgroundImage: `url(${track.album_image})` }}
                    />
                  )}
                  <div className="emotion-detector__track-meta">
                    <p className="emotion-detector__track-name">{track.name}</p>
                    <span className="emotion-detector__track-artists">{track.artists}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }
);

export default EmotionDetector;

