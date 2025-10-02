from base64 import b64encode, b64decode
from deepface import DeepFace

emotion = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]



emotion = DeepFace.analyse(image_path, action=['emotion'])
