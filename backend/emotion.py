import cv2
import numpy as np
import os
import sys
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from base64 import b64encode, b64decode
from deepface import DeepFace

emotion = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]

image_path = "path/to/your/image.jpg"

emotion = DeepFace.analyse(image_path, action=['emotion'])
