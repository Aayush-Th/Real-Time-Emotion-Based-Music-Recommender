from flask import Flask,render_template

app = (__name__)

@app.route('/')
def home():
    return "Real-Time Emotion-Based Music Recommender"