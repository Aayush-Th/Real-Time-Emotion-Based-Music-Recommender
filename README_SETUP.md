# MoodTunes - Emotion-Based Music Recommender

## Overview

MoodTunes is a real-time emotion detection application that recommends songs based on your facial expressions and emotional state. It uses advanced facial recognition AI to detect emotions and suggests personalized music recommendations.

## Key Features

- **Real-Time Emotion Detection**: Uses facial recognition to detect emotions (happy, sad, angry, fear, disgust, surprise, neutral)
- **Language & Region Support**: Choose your preferred language and region for personalized recommendations
- **Emotion History**: Track all your emotion detection sessions with MongoDB
- **Music Recommendations**: Get personalized song recommendations based on detected emotions
- **Spotify Integration**: Ready for Spotify API integration (placeholder currently in place)
- **User Preferences**: Save and retrieve user preferences and history

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- CSS3 with modern styling
- Local storage for session management

### Backend
- Flask (Python web framework)
- MongoDB (NoSQL database)
- TensorFlow/Keras (emotion detection model)
- OpenCV (face detection)
- Spotify API (music recommendations)

## Project Structure

```
Mini_Project/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── routes.py              # API routes for emotion detection
│   ├── emotion.py             # Emotion detection model
│   ├── mongo_db.py            # MongoDB models and utilities
│   ├── recommendations.py     # Music recommendation logic
│   ├── db.py                  # Legacy SQLite database setup
│   ├── config.py              # Configuration
│   ├── model.h5               # Pre-trained emotion model
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Environment variables template
│   └── __pycache__/
│
└── frontend/
    └── moodtunes-react/
        ├── src/
        │   ├── pages/
        │   │   ├── HomePage.jsx          # Landing page with Get Started button
        │   │   ├── SetupPage.jsx         # Language, region, and history
        │   │   ├── ExperiencePage.jsx    # Emotion detection interface
        │   │   ├── DashboardPage.jsx     # User dashboard
        │   │   └── *.css                 # Page styles
        │   ├── components/
        │   │   ├── emotion/
        │   │   │   └── EmotionDetector.jsx    # Camera & detection component
        │   │   ├── common/
        │   │   │   ├── Navbar.jsx
        │   │   │   └── AccountMenu.jsx
        │   │   └── auth/
        │   │       ├── LoginModal.jsx
        │   │       └── SignupModal.jsx
        │   ├── context/
        │   │   └── AuthContext.jsx       # Authentication context
        │   └── lib/
        │       └── localDb.js            # Local storage utilities
        ├── package.json
        └── public/
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- MongoDB 4.4+
- Git

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/Scripts/activate  # On Windows
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Create .env file**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start MongoDB** (if using local MongoDB)
```bash
mongod
```

6. **Run backend server**
```bash
python app.py
```

Backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend/moodtunes-react
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

Frontend will be available at `http://localhost:3000`

## API Endpoints

### Emotion Detection & History

- **POST /api/detect** - Detect emotion from image
  - Body: `{ image_data: "base64_string", metadata: {...}, limit: 10 }`
  - Returns: `{ emotion, confidence, tracks }`

- **GET /api/history** - Get user's emotion history
  - Query: `email=user@example.com&limit=10`
  - Returns: `{ records: [...], total: count }`

- **GET /api/history/<record_id>** - Get specific record
  - Returns: Single emotion record

- **GET /api/user/preferences** - Get user preferences
  - Query: `email=user@example.com`
  - Returns: User preferences object

- **POST /api/user/preferences** - Update user preferences
  - Body: `{ email, name, preferred_language, preferred_region }`
  - Returns: `{ message: "Preferences updated successfully" }`

## Navigation Flow

1. **Home Page** (`/`) - Landing page with "Get Started Free" button
2. **Setup Page** (`/setup`) - Select language, region, and view history
3. **Experience Page** (`/experience`) - Detect emotion and get recommendations
4. **Dashboard Page** (`/dashboard`) - View overall statistics and history

## Database Schema (MongoDB)

### mood_records Collection
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "name": "User Name",
  "region": "IN",
  "language": "en",
  "detected_emotion": "happy",
  "confidence": 0.95,
  "spotify_tracks": [
    {
      "name": "Track Name",
      "artists": ["Artist 1", "Artist 2"],
      "album": "Album Name",
      "external_urls": { "spotify": "https://..." }
    }
  ],
  "created_at": ISODate()
}
```

### user_preferences Collection
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "name": "User Name",
  "preferred_language": "en",
  "preferred_region": "IN",
  "spotify_token": "token_string",
  "updated_at": ISODate()
}
```

## Emotion Categories

The model detects the following emotions:
- **Happy** (😊) - Positive, energetic mood
- **Sad** (😢) - Low mood, melancholic
- **Angry** (😠) - Intense, aggressive mood
- **Fear** (😨) - Anxious, fearful mood
- **Disgust** (🤢) - Revolted, displeased mood
- **Surprise** (😲) - Shocked, amazed mood
- **Neutral** (😐) - Calm, neutral mood

## Music Recommendations

Music recommendations are based on emotion-specific audio features:

- **Happy**: Pop, Dance music (high valence, moderate energy)
- **Sad**: Acoustic, Indie music (low valence, low energy)
- **Angry**: Metal, Rock music (low valence, high energy)
- **Fear**: Ambient, Classical music (low valence, moderate-high energy)
- **Disgust**: Punk, Grunge music (very low valence, moderate energy)
- **Surprise**: EDM, Electronic music (high valence, high energy)
- **Neutral**: Chill, Lofi music (moderate valence and energy)

## Spotify Integration

The application currently uses placeholder recommendation data. To integrate real Spotify music:

1. **Get Spotify Credentials**
   - Go to https://developer.spotify.com/dashboard
   - Create an app
   - Get Client ID and Client Secret

2. **Update .env**
   ```
   SPOTIFY_CLIENT_ID=your-id
   SPOTIFY_CLIENT_SECRET=your-secret
   ```

3. **Uncomment Spotify code in app.py** and use the `/recommend` endpoint

## Environment Variables

```
FLASK_ENV=development
SECRET_KEY=your-secret-key
BACKEND_CORS_ORIGINS=http://localhost:3000
MONGODB_URL=mongodb://localhost:27017
DB_NAME=moodtunes
SPOTIFY_CLIENT_ID=your-id
SPOTIFY_CLIENT_SECRET=your-secret
```

## Error Handling

- **No Face Detected**: Ensure your face is clearly visible in the camera
- **Database Connection Error**: Check MongoDB is running
- **Image Decode Error**: Ensure camera/image upload is working correctly
- **Emotion Model Not Found**: Verify `model.h5` exists in backend directory

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB
mongod
```

### Frontend CORS Errors
- Check `BACKEND_CORS_ORIGINS` in `.env`
- Ensure both frontend and backend are running

### Camera Permission Denied
- Allow camera access in browser settings
- Check browser console for specific errors

### Emotion Model Not Loading
- Verify `backend/model.h5` file exists
- Check file permissions
- Ensure TensorFlow is installed correctly

## Future Enhancements

- [ ] Real Spotify API integration
- [ ] User authentication (Firebase/Auth0)
- [ ] Social sharing of music recommendations
- [ ] Mood-based playlist generation
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multiple language support for UI
- [ ] Emotion trend analysis
- [ ] Integration with other music platforms (Apple Music, YouTube Music)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues or questions:
- Open an issue on GitHub
- Contact the development team

## Acknowledgments

- TensorFlow/Keras for emotion detection model
- Spotify for music data API
- OpenCV for face detection
- MongoDB for database
- React for frontend framework
