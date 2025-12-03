# routes.py
import base64
import json

import cv2
import numpy as np
from flask import Blueprint, request, jsonify, current_app

from mongo_db import mood_record, user_preference, check_db_connection
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