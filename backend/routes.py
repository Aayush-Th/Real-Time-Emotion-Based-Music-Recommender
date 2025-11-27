# route.py
import base64
import json

import cv2
import numpy as np
from flask import Blueprint, request, jsonify, current_app

from db import save_mood_record, fetch_mood_records
from emotion import detect_emotion_from_image
from recommendations import get_recommendations_for_emotion

emotion_bp = Blueprint("emotion_bp", __name__)


@emotion_bp.route("/detect", methods=["POST"])
def detect():
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
        try:
            save_mood_record(
                email=metadata.get("email"),
                name=metadata.get("name"),
                selected_mood=metadata.get("mood"),
                region=metadata.get("region"),
                language=metadata.get("language"),
                detected_emotion=label,
                confidence=confidence,
                spotify_tracks=tracks,
            )
        except Exception:
            current_app.logger.exception("Failed to persist mood session")
        return jsonify(
            {
                "emotion": label,
                "confidence": round(confidence, 4),
                "tracks": tracks,
            }
        )
    except ValueError as exc:
        current_app.logger.warning("Emotion detection validation failed: %s", exc)
        return jsonify({"error": str(exc)}), 400
    except Exception:
        current_app.logger.exception("Unexpected error during emotion detection")
        return jsonify({"error": "Failed to detect emotion"}), 500


@emotion_bp.route("/records", methods=["GET"])
def records():
    email = request.args.get("email")
    limit = request.args.get("limit", 10)
    try:
        limit = min(50, max(1, int(limit)))
    except (TypeError, ValueError):
        limit = 10
    records = fetch_mood_records(email=email, limit=limit)
    return jsonify(
        [
            {
                "id": record.id,
                "email": record.email,
                "name": record.name,
                "selected_mood": record.selected_mood,
                "region": record.region,
                "language": record.language,
                "detected_emotion": record.detected_emotion,
                "confidence": record.confidence,
                "spotify_tracks": json.loads(record.spotify_tracks or "[]"),
                "created_at": record.created_at.isoformat(),
            }
            for record in records
        ]
    )