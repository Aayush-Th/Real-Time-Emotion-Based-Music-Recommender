# from flask import Flask,render_template,requests,redirect,flash
# import sys


# def create_app():
#     app = Flask(__name__)

# # @app.route('/')
# # @app.route('/home')
# def home():
#     return render_template('home.html')

    
import os, time, base64
from urllib.parse import urlencode
from flask import Flask, redirect, request, session, jsonify
import requests
from dotenv import load_dotenv
from flask_cors import CORS 

app = Flask(__name__)

@app.route('/')
@app.route('/home')
def home():
    return "welcome to real time emotion based music recommender"

load_dotenv()
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret")

SPOTIFY_CLIENT_ID = os.environ["SPOTIFY_CLIENT_ID"]
SPOTIFY_CLIENT_SECRET = os.environ["SPOTIFY_CLIENT_SECRET"]
SPOTIFY_REDIRECT_URI = os.environ.get("SPOTIFY_REDIRECT_URI", "http://localhost:5000/callback")
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"

# Simple emotion -> audio feature mapping
# Targets follow literature (valence ~ positivity, energy ~ arousal); seed genres guide mood. [9]
EMOTION_MAPPING = {
    "happy":  dict(target_valence=0.85, target_energy=0.7, seed_genres=["pop","dance"]),
    "sad":    dict(target_valence=0.2,  target_energy=0.3, seed_genres=["acoustic","indie"]),
    "angry":  dict(target_valence=0.2,  target_energy=0.85,seed_genres=["metal","rock"]),
    "fear":   dict(target_valence=0.25, target_energy=0.6, seed_genres=["ambient","classical"]),
    "surprise":dict(target_valence=0.7, target_energy=0.8, seed_genres=["edm","electronic"]),
    "neutral":dict(target_valence=0.5,  target_energy=0.5, seed_genres=["chill","lofi"]),
}

# Optional: add constraints supported by Spotify recommendations (danceability, acousticness, loudness, tempo) [9]
def build_target_params(emotion_cfg):
    params = {
        "target_valence": emotion_cfg["target_valence"],
        "target_energy": emotion_cfg["target_energy"],
    }
    # Example heuristics: more acoustic for sad/fear; more danceable for happy/surprise. [9]
    if emotion_cfg["seed_genres"] in ("acoustic","indie","ambient","classical"):
        params["max_loudness"] = -5
        params["target_acousticness"] = 0.6
    else:
        params["target_danceability"] = 0.6
    return params

def get_basic_auth_header():
    token = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    b64 = base64.b64encode(token.encode()).decode()
    return {"Authorization": f"Basic {b64}"}

def token_headers():
    return {"Authorization": f"Bearer {session['access_token']}"}

def ensure_token():
    # Refresh if token expired
    if "access_token" in session and time.time() < session.get("expires_at", 0) - 30:
        return
    if "refresh_token" in session:
        data = {
            "grant_type": "refresh_token",
            "refresh_token": session["refresh_token"],
        }
        res = requests.post(SPOTIFY_TOKEN_URL, data=data, headers=get_basic_auth_header())
        res.raise_for_status()
        payload = res.json()
        session["access_token"] = payload["access_token"]
        # some refresh responses omit refresh_token
        if "refresh_token" in payload:
            session["refresh_token"] = payload["refresh_token"]
        session["expires_at"] = time.time() + payload.get("expires_in", 3600)
    else:
        raise RuntimeError("No Spotify token; login first.")

@app.route("/auth/login")
def login():
    scope = "user-read-email"  # listing recommendations does not need playback scope [1]
    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": scope,
        "show_dialog": "false",
    }
    return redirect(f"{SPOTIFY_AUTH_URL}?{urlencode(params)}")  # [1][11]

@app.route("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "missing code"}), 400
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": SPOTIFY_REDIRECT_URI,
    }
    res = requests.post(SPOTIFY_TOKEN_URL, data=data, headers=get_basic_auth_header())
    res.raise_for_status()
    payload = res.json()
    session["access_token"] = payload["access_token"]
    session["refresh_token"] = payload.get("refresh_token")
    session["expires_at"] = time.time() + payload.get("expires_in", 3600)
    return redirect("/whoami")

@app.route("/whoami")
def whoami():
    ensure_token()
    r = requests.get(f"{SPOTIFY_API_BASE}/me", headers=token_headers())
    return jsonify(r.json())

@app.route("/recommend")
def recommend():
    # inputs: emotion, limit, market
    emotion = (request.args.get("emotion") or "neutral").lower()
    limit = int(request.args.get("limit", 20))
    market = request.args.get("market", "IN")
    cfg = EMOTION_MAPPING.get(emotion, EMOTION_MAPPING["neutral"])
    targets = build_target_params(cfg)

    # For recommendations: need at least one of seed_artists, seed_genres, seed_tracks (up to 5 items) [1]
    seed_genres = ",".join(cfg["seed_genres"][:3])
    params = {
        "limit": min(limit, 50),
        "market": market,
        "seed_genres": seed_genres,
        **targets,
    }

    ensure_token()
    r = requests.get(f"{SPOTIFY_API_BASE}/recommendations", params=params, headers=token_headers())
    r.raise_for_status()
    data = r.json()
    # shape a compact response for frontend
    tracks = [
        {
            "id": t["id"],
            "name": t["name"],
            "artists": ", ".join(a["name"] for a in t["artists"]),
            "album_image": (t["album"]["images"]["url"] if t["album"]["images"] else None),
            "preview_url": t.get("preview_url"),
            "external_url": t["external_urls"]["spotify"],
        }
        for t in data.get("tracks", [])
    ]
    return jsonify({"emotion": emotion, "params": params, "tracks": tracks})

# if __name__ == "__main__":
#     app.run(debug=True)
