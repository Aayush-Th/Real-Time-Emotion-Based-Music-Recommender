# route.py
from flask import Blueprint, request, jsonify
from emotion import detect_emotion

emotion_bp = Blueprint('emotion_bp', __name__)

@emotion_bp.route('/detect', methods=['POST'])
def detect():
    image_path = request.json.get('image_path')
    if not image_path:
        return jsonify({'error': 'No image path provided'}), 400

    try:
        emotion = detect_emotion(image_path)
        return jsonify({'emotion': emotion})
    except Exception as e:
        return jsonify({'error': str(e)}), 500