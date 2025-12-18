# routes.py
import base64
import json

import cv2
import numpy as np
from flask import Blueprint, request, jsonify, current_app, session

from mongo_db import mood_record, user_preference, users, check_db_connection
from emotion import detect_emotion_from_image
from recommendations import get_recommendations_for_emotion

emotion_bp = Blueprint("emotion_bp", __name__)


@emotion_bp.route("/detect", methods=["POST"])
def detect():
    """
    Detect emotion from image and return recommendations.
    Expects JSON payload with:
    - image_data: base64 encoded image
    - metadata: dict with email, name, region, language
    - limit: max number of recommendations (default 5, max 10)
    """
    payload = request.get_json(silent=True)
    if not payload or "image_data" not in payload:
        return jsonify({"error": "image_data is required"}), 400

    image_data = payload["image_data"]
    limit = payload.get("limit", 5)
    try:
        limit = min(10, max(1, int(limit)))
    except (TypeError, ValueError):
        limit = 5

    try:
        _, headerless = image_data.split(",", 1) if "," in image_data else ("", image_data)
        image_bytes = base64.b64decode(headerless)
    except (ValueError, TypeError):
        return jsonify({"error": "Unable to parse image_data"}), 400

    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        return jsonify({"error": "Unable to decode image data"}), 400

    try:
        label, confidence = detect_emotion_from_image(image)

        # Try Spotify recommendations first when configured and session has tokens
        tracks = None
        try:
            from os import environ
            import requests as _requests

            SPOTIFY_ENABLED = bool(environ.get('SPOTIFY_CLIENT_ID') and environ.get('SPOTIFY_CLIENT_SECRET'))
            if SPOTIFY_ENABLED and 'access_token' in session:
                # map simple emotion targets (valence/energy) similar to app.py
                EMOTION_CFG = {
                    'happy': dict(target_valence=0.85, target_energy=0.7),
                    'sad': dict(target_valence=0.2, target_energy=0.3),
                    'angry': dict(target_valence=0.2, target_energy=0.85),
                    'disgust': dict(target_valence=0.1, target_energy=0.4),
                    'fear': dict(target_valence=0.25, target_energy=0.6),
                    'surprise': dict(target_valence=0.7, target_energy=0.8),
                    'neutral': dict(target_valence=0.5, target_energy=0.5),
                }

                # language -> seed genres mapping (best-effort; Spotify genre availability varies)
                LANG_GENRES = {
                    'hi': ['bollywood', 'indian'],
                    'en': ['pop', 'dance'],
                    'es': ['latin', 'reggaeton'],
                    'pt': ['brazil', 'mpb'],
                    'fr': ['french'],
                    'de': ['german'],
                }

                lang = (metadata.get('language') or '').lower()
                region = metadata.get('region') or 'IN'

                cfg = EMOTION_CFG.get(label, EMOTION_CFG['neutral'])
                params = {
                    'limit': min(limit, 50),
                    'market': region,
                    'seed_genres': ','.join(LANG_GENRES.get(lang, cfg.get('seed_genres', ['pop']) if cfg.get('seed_genres') else ['pop'])),
                    'target_valence': cfg['target_valence'],
                    'target_energy': cfg['target_energy'],
                }

                # call Spotify recommendations endpoint with our session token
                spotify_res = _requests.get('https://api.spotify.com/v1/recommendations', params=params, headers={
                    'Authorization': f"Bearer {session.get('access_token')}"
                }, timeout=10)

                if spotify_res.ok:
                    sdata = spotify_res.json()
                    tracks = [
                        {
                            'id': t['id'],
                            'name': t['name'],
                            'artists': ', '.join(a['name'] for a in t['artists']),
                            'album_image': (t['album']['images'][0]['url'] if t['album'].get('images') else None),
                            'preview_url': t.get('preview_url'),
                            'external_url': t['external_urls']['spotify'],
                        }
                        for t in sdata.get('tracks', [])
                    ]
                else:
                    current_app.logger.warning(f"Spotify recommendations failed: {spotify_res.status_code} {spotify_res.text}")
        except Exception as spotify_exc:
            current_app.logger.exception(f"Spotify recommendation attempt failed: {spotify_exc}")

        # Fall back to built-in library if spotify didn't produce tracks
        if not tracks:
            tracks = get_recommendations_for_emotion(label, limit=limit)
        metadata = payload.get("metadata", {}) or {}
        
        # Save to MongoDB if available
        if check_db_connection() and mood_record:
            try:
                email = metadata.get("email")
                
                # Save mood record
                mood_record.create(
                    email=email,
                    name=metadata.get("name"),
                    region=metadata.get("region"),
                    language=metadata.get("language"),
                    detected_emotion=label,
                    confidence=confidence,
                    spotify_tracks=tracks,
                    image_data=image_data
                )
                
                # Update user preferences if email exists
                if email:
                    user_preference.create_or_update(
                        email=email,
                        name=metadata.get("name"),
                        preferred_language=metadata.get("language"),
                        preferred_region=metadata.get("region")
                    )
            except Exception as e:
                current_app.logger.exception(f"Failed to save mood record: {e}")
        
        return jsonify({
            "emotion": label,
            "confidence": round(confidence, 4),
            "tracks": tracks,
            "message": "Emotion detected successfully"
        })
        
    except ValueError as exc:
        current_app.logger.warning(f"Emotion detection validation failed: {exc}")
        return jsonify({"error": str(exc)}), 400
    except Exception as e:
        current_app.logger.exception("Unexpected error during emotion detection")
        return jsonify({"error": "Failed to detect emotion"}), 500


@emotion_bp.route("/history", methods=["GET"])
def history():
    """
    Fetch mood history for a user.
    Query params:
    - email: user email (required)
    - limit: max records to return (default 10, max 50)
    """
    email = request.args.get("email")
    limit = request.args.get("limit", 10)
    
    if not email:
        return jsonify({"error": "email parameter is required"}), 400
    
    try:
        limit = min(50, max(1, int(limit)))
    except (TypeError, ValueError):
        limit = 10
    
    if not check_db_connection() or not mood_record:
        return jsonify({"error": "Database connection unavailable"}), 503
    
    try:
        records = mood_record.find_by_email(email, limit=limit)
        return jsonify({
            "records": records,
            "total": len(records)
        })
    except Exception as e:
        current_app.logger.exception(f"Failed to fetch history: {e}")
        return jsonify({"error": "Failed to fetch history"}), 500


@emotion_bp.route("/history/<record_id>", methods=["GET"])
def get_history_record(record_id):
    """Get a specific mood record by ID"""
    if not check_db_connection() or not mood_record:
        return jsonify({"error": "Database connection unavailable"}), 503
    
    try:
        record = mood_record.find_by_id(record_id)
        if not record:
            return jsonify({"error": "Record not found"}), 404
        return jsonify(record)
    except Exception as e:
        current_app.logger.exception(f"Failed to fetch record: {e}")
        return jsonify({"error": "Failed to fetch record"}), 500


@emotion_bp.route("/user/preferences", methods=["GET"])
def get_user_preferences():
    """Get user preferences by email"""
    email = request.args.get("email")
    
    if not email:
        return jsonify({"error": "email parameter is required"}), 400
    
    if not check_db_connection() or not user_preference:
        return jsonify({"error": "Database connection unavailable"}), 503
    
    try:
        preferences = user_preference.find_by_email(email)
        if not preferences:
            return jsonify({"error": "User preferences not found"}), 404
        return jsonify(preferences)
    except Exception as e:
        current_app.logger.exception(f"Failed to fetch preferences: {e}")
        return jsonify({"error": "Failed to fetch preferences"}), 500


@emotion_bp.route("/user/preferences", methods=["POST"])
def update_user_preferences():
    """Update user preferences"""
    payload = request.get_json(silent=True)
    if not payload or "email" not in payload:
        return jsonify({"error": "email is required"}), 400
    
    if not check_db_connection() or not user_preference:
        return jsonify({"error": "Database connection unavailable"}), 503
    
    try:
        email = payload.get("email")
        user_preference.create_or_update(
            email=email,
            name=payload.get("name"),
            preferred_language=payload.get("preferred_language"),
            preferred_region=payload.get("preferred_region")
        )
        return jsonify({"message": "Preferences updated successfully"}), 200
    except Exception as e:
        current_app.logger.exception(f"Failed to update preferences: {e}")
        return jsonify({"error": "Failed to update preferences"}), 500


@emotion_bp.route("/records", methods=["GET"])
def records():
    """Legacy endpoint for fetching records (uses MongoDB)"""
    email = request.args.get("email")
    limit = request.args.get("limit", 10)
    try:
        limit = min(50, max(1, int(limit)))
    except (TypeError, ValueError):
        limit = 10
    
    if not check_db_connection() or not mood_record:
        return jsonify({"error": "Database connection unavailable"}), 503
    
    try:
        records_list = mood_record.find_by_email(email, limit=limit) if email else mood_record.find_all(limit=limit)
        return jsonify(records_list)
    except Exception as e:
        current_app.logger.exception(f"Failed to fetch records: {e}")
        return jsonify({"error": "Failed to fetch records"}), 500


@emotion_bp.route('/auth/register', methods=['POST'])
def register():
    """Register a new user (stores hashed password in MongoDB)

    Expects JSON: { name, email, password }
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "Missing payload"}), 400

    name = payload.get('name')
    email = payload.get('email')
    password = payload.get('password')

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if not check_db_connection() or not users:
        return jsonify({"error": "Database unavailable"}), 503

    try:
        existing = users.find_by_email(email)
        if existing:
            return jsonify({"error": "Email already registered"}), 409

        user_doc = users.create_user(name=name, email=email, password=password)
        # Do not auto-login; return success and prompt client to login
        return jsonify({"message": "Registered successfully", "user": {"email": user_doc.get('email'), "name": user_doc.get('name')}}), 201
    except Exception as e:
        current_app.logger.exception(f"Registration failed: {e}")
        return jsonify({"error": "Registration failed"}), 500


@emotion_bp.route('/auth/login', methods=['POST'])
def login():
    """Authenticate a user.

    Expects JSON: { email, password }
    Returns: user info on success
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "Missing payload"}), 400

    email = payload.get('email')
    password = payload.get('password')

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if not check_db_connection() or not users:
        return jsonify({"error": "Database unavailable"}), 503

    try:
        ok, user_doc = users.verify_password(email, password)
        if not ok:
            return jsonify({"error": "Invalid email or password"}), 401

        # Return minimal user info
        user_info = {"email": user_doc.get('email'), "name": user_doc.get('name')}
        return jsonify({"message": "Login successful", "user": user_info}), 200
    except Exception as e:
        current_app.logger.exception(f"Login failed: {e}")
        return jsonify({"error": "Login failed"}), 500


@emotion_bp.route('/auth/logout', methods=['POST'])
def auth_logout():
    """Clear server-side session (Spotify tokens etc.) and return success."""
    try:
        for k in ('access_token', 'refresh_token', 'expires_at'):
            session.pop(k, None)
        return jsonify({"message": "Logged out"}), 200
    except Exception as e:
        current_app.logger.exception(f"Logout failed: {e}")
        return jsonify({"error": "Logout failed"}), 500


@emotion_bp.route('/debug/users', methods=['GET'])
def debug_users():
    """Debug endpoint to list users (no password hashes). Enabled when ALLOW_DEBUG env var is 'true'."""
    from os import environ
    if environ.get('ALLOW_DEBUG', 'false').lower() != 'true':
        return jsonify({"error": "Debug endpoints are disabled"}), 403

    if not check_db_connection() or not users:
        return jsonify({"error": "Database unavailable"}), 503

    try:
        docs = list(users.collection.find({}, {"password_hash": 0}).limit(100))
        # Convert ObjectId to string
        for d in docs:
            d["_id"] = str(d.get("_id"))
        return jsonify({"users": docs})
    except Exception as e:
        current_app.logger.exception(f"Failed to list users: {e}")
        return jsonify({"error": "Failed to list users"}), 500


@emotion_bp.route('/debug/seed_user', methods=['POST'])
def debug_seed_user():
    """Create a test user for local development. Enabled only when ALLOW_DEBUG='true'."""
    from os import environ
    if environ.get('ALLOW_DEBUG', 'false').lower() != 'true':
        return jsonify({"error": "Debug endpoints are disabled"}), 403

    payload = request.get_json(silent=True) or {}
    name = payload.get('name', 'Dev User')
    email = payload.get('email', 'dev@example.com')
    password = payload.get('password', 'password123')

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if not check_db_connection() or not users:
        return jsonify({"error": "Database unavailable"}), 503

    try:
        existing = users.find_by_email(email)
        if existing:
            return jsonify({"message": "User already exists", "user": {"email": existing.get('email'), "name": existing.get('name')}}), 200

        user_doc = users.create_user(name=name, email=email, password=password)
        return jsonify({"message": "Seeded test user", "user": {"email": user_doc.get('email'), "name": user_doc.get('name')}}), 201
    except Exception as e:
        current_app.logger.exception(f"Failed to seed test user: {e}")
        return jsonify({"error": "Failed to seed test user"}), 500


@emotion_bp.route('/ai/generate_params', methods=['POST'])
def ai_generate_params():
    """Generate Spotify recommendation params from user emotion/language/extra info.

    Accepts JSON: { emotion, language, extra_info }
    Returns JSON with the fixed template (emotion, language, market, seed_genres, seed_artists_description, extra_keywords)
    If OPENAI_API_KEY is configured, attempt to call the OpenAI Chat Completions API and parse JSON out of it. Otherwise return a deterministic fallback.
    """
    payload = request.get_json(silent=True) or {}
    emotion = (payload.get('emotion') or '').lower()
    language = (payload.get('language') or '').lower()
    extra = payload.get('extra_info') or ''

    # Validate inputs
    if not emotion or not language:
        return jsonify({"error": "emotion and language are required"}), 400

    # Build system + user prompt per requested template
    system = (
        "You are an assistant that converts user mood and language preferences into Spotify recommendation parameters.\n"
        "Always respond in JSON with these fields: emotion, language, market, seed_genres, seed_artists_description, extra_keywords.\n"
        "market is a 2-letter country code. seed_genres is a short list of Spotify-style genres. "
        "seed_artists_description is a short text description of 2–3 example artists in that language and mood (not IDs). "
        "extra_keywords are mood/scene words for searching or explaining."
    )

    user_prompt = (
        f"User emotion: \"{emotion}\"\nPreferred language: \"{language}\"\nExtra info: \"{extra}\"\n"
        "Generate Spotify parameters and always return a single valid JSON object with the exact fields specified."
    )

    # Try OpenAI if key is available
    from os import environ
    OPENAI_KEY = environ.get('OPENAI_API_KEY')
    if OPENAI_KEY:
        try:
            # Call OpenAI chat completions (HTTP) to keep dependency minimal
            headers = {
                'Authorization': f'Bearer {OPENAI_KEY}',
                'Content-Type': 'application/json',
            }
            body = {
                'model': 'gpt-4o-mini',
                'messages': [
                    {'role': 'system', 'content': system},
                    {'role': 'user', 'content': user_prompt},
                ],
                'max_tokens': 300,
                'temperature': 0.4,
            }
            import requests as _requests
            r = _requests.post('https://api.openai.com/v1/chat/completions', json=body, headers=headers, timeout=10)
            r.raise_for_status()
            response_text = r.json()['choices'][0]['message']['content']

            # Try to extract JSON from the assistant output
            import re, json as _json
            m = re.search(r'\{[\s\S]*\}', response_text)
            if not m:
                return jsonify({"error": "AI did not return JSON"}), 502
            parsed = _json.loads(m.group(0))

            # Basic validation
            required = ['emotion', 'language', 'market', 'seed_genres', 'seed_artists_description', 'extra_keywords']
            if not all(k in parsed for k in required):
                return jsonify({"error": "AI returned JSON missing required fields", "data": parsed}), 502
            return jsonify(parsed)
        except Exception as e:
            current_app.logger.exception(f"AI generation failed: {e}")

    # Fallback deterministic generator
    LANG_GENRES = {
        'hi': ['bollywood', 'desi', 'dance'],
        'en': ['pop', 'dance'],
        'es': ['latin', 'reggaeton'],
        'pt': ['brazil', 'mpb'],
        'fr': ['french', 'chanson'],
        'de': ['german', 'schlager'],
    }

    market = 'IN' if language == 'hi' else 'US'
    seed_genres = LANG_GENRES.get(language, ['pop'])[:3]
    seed_artists_description = (
        'Popular upbeat artists and playback singers in the language' if emotion == 'happy' else
        'Melancholic, calm artists with emotive vocals' if emotion == 'sad' else
        'Popular artists matching the mood in that language'
    )
    extra_keywords = [emotion, 'mood', 'playlist']
    if extra:
        extra_keywords += [x.strip() for x in extra.split(',') if x.strip()]

    out = {
        'emotion': emotion,
        'language': language,
        'market': market,
        'seed_genres': seed_genres,
        'seed_artists_description': seed_artists_description,
        'extra_keywords': extra_keywords,
    }
    return jsonify(out)