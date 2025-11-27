import os

import cv2
import numpy as np
from keras.models import load_model
from keras.preprocessing.image import img_to_array

EMOTION_LABELS = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]

_model = None
_face_cascade = None
_model_path = os.path.join(os.path.dirname(__file__), "model.h5")
_cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"


def _load_resources():
    global _model, _face_cascade
    if _face_cascade is None:
        _face_cascade = cv2.CascadeClassifier(_cascade_path)
        if _face_cascade.empty():
            raise RuntimeError("Unable to load face detector.")
    if _model is None:
        if not os.path.isfile(_model_path):
            raise FileNotFoundError(f"Emotion model not found at {_model_path}")
        _model = load_model(_model_path)
    return _face_cascade, _model


def detect_emotion_from_image(image):
    if image is None:
        raise ValueError("No image data was supplied.")
    face_cascade, classifier = _load_resources()
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
    if len(faces) == 0:
        raise ValueError("No face detected. Please retake the photo with your face centered.")

    for (x, y, w, h) in faces:
        roi = gray[y : y + h, x : x + w]
        if roi.size == 0:
            continue
        roi = cv2.resize(roi, (48, 48), interpolation=cv2.INTER_AREA)
        roi = roi.astype("float") / 255.0
        roi = img_to_array(roi)
        roi = np.expand_dims(roi, axis=0)
        prediction = classifier.predict(roi)[0]
        label_index = int(np.argmax(prediction))
        label = EMOTION_LABELS[label_index]
        confidence = float(np.max(prediction))
        return label, confidence

    raise ValueError("Unable to extract a face from the provided image.")
