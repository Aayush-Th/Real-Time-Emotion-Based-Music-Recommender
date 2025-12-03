# Quick Start Guide - MoodTunes

## What's New

Your MoodTunes application now has complete end-to-end emotion detection and music recommendation system with MongoDB integration!

### New Pages Added

1. **SetupPage** (`/setup`) - After clicking "Get Started" button
   - Choose your preferred language and region
   - View your emotion detection history (saved in MongoDB)
   - Quick navigation to start detecting emotions

2. **ExperiencePage** (`/experience`) - Main emotion detection interface
   - Set language and region preferences
   - Capture your facial expression via camera
   - Real-time emotion detection using AI
   - Get instant music recommendations based on your mood
   - All sessions saved to MongoDB

3. **Updated HomePage** - "Get Started Free" button now navigates to SetupPage

## Flow

```
Home Page
    ↓ (Click "Get Started Free")
    ↓
Setup Page (Language, Region, View History)
    ↓ (Click "Start Emotion Detection")
    ↓
Experience Page (Detect Emotion → Get Recommendations)
```

## Installation & Running

### Step 1: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies (includes MongoDB support now)
pip install -r requirements.txt

# Create .env file with your config
cp .env.example .env

# Start MongoDB (if using local instance)
mongod

# Run Flask server
python app.py
```

**Backend runs at:** http://localhost:5000

### Step 2: Frontend Setup

```bash
cd frontend/moodtunes-react

# Install dependencies
npm install

# Start React app
npm start
```

**Frontend runs at:** http://localhost:3000

## Key Features Implemented

✅ **Language Support**
- English, Hindi, Spanish, French, German, Portuguese

✅ **Region Selection**
- India, US, UK, Canada, Australia, Germany

✅ **Emotion Detection**
- Happy, Sad, Angry, Fear, Disgust, Surprise, Neutral
- Uses pre-trained TensorFlow model

✅ **MongoDB Integration**
- Store mood records with full metadata
- Track emotion history per user
- Store user preferences
- All data persists across sessions

✅ **Music Recommendations**
- Emotion-specific audio features
- Ready for Spotify API integration
- Placeholder recommendations currently shown

✅ **User Interface**
- Beautiful gradient designs
- Responsive mobile-friendly layout
- Smooth navigation between pages
- Real-time feedback messages

## API Endpoints Available

### Emotion Detection
```bash
POST http://localhost:5000/api/detect
Body: {
  "image_data": "base64_string",
  "metadata": {
    "email": "user@example.com",
    "name": "User Name",
    "language": "en",
    "region": "IN"
  },
  "limit": 10
}
```

### Get History
```bash
GET http://localhost:5000/api/history?email=user@example.com&limit=10
```

### Get User Preferences
```bash
GET http://localhost:5000/api/user/preferences?email=user@example.com
```

### Update User Preferences
```bash
POST http://localhost:5000/api/user/preferences
Body: {
  "email": "user@example.com",
  "name": "User Name",
  "preferred_language": "en",
  "preferred_region": "IN"
}
```

## MongoDB Collections

Your data is stored in two collections:

### mood_records
- Stores each emotion detection session
- Fields: email, name, detected_emotion, confidence, region, language, spotify_tracks, created_at

### user_preferences
- Stores user settings
- Fields: email, name, preferred_language, preferred_region, spotify_token, updated_at

## Testing the App

1. **Sign Up**: Use the signup modal on homepage to create an account
2. **Click Get Started**: Navigate to SetupPage
3. **Choose Preferences**: Select language and region
4. **Click Start Detection**: Go to ExperiencePage
5. **Capture Expression**: Ensure good lighting, position face in frame
6. **Get Recommendations**: See emotion-based song suggestions
7. **View History**: Go back to SetupPage to see all your sessions

## Environment Configuration

Key variables in `.env`:

```
# Database
MONGODB_URL=mongodb://localhost:27017
DB_NAME=moodtunes

# Frontend
BACKEND_CORS_ORIGINS=http://localhost:3000

# Spotify (Optional - for real recommendations)
SPOTIFY_CLIENT_ID=your-id
SPOTIFY_CLIENT_SECRET=your-secret
```

## Customization Options

### Add More Languages
Edit in `SetupPage.jsx`:
```jsx
<option value="ja">🇯🇵 Japanese</option>
<option value="ru">🇷🇺 Russian</option>
```

### Add More Regions
Edit in `SetupPage.jsx` and `ExperiencePage.jsx`:
```jsx
<option value="JP">🇯🇵 Japan</option>
<option value="MX">🇲🇽 Mexico</option>
```

### Change Colors & Theme
Edit CSS variables in component `.css` files or update main CSS file

### Connect Real Spotify
1. Get Spotify API credentials
2. Update `.env` with SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
3. Uncomment Spotify code in `app.py`
4. Update `recommendations.py` to use real Spotify API

## Common Issues & Solutions

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod

# Or use MongoDB Atlas cloud version
# Update MONGODB_URL in .env to: mongodb+srv://user:pass@cluster.mongodb.net/db
```

### Camera Permission Denied
- Allow camera in browser settings
- Check Privacy & Security settings
- Try in incognito/private mode

### Emotion Model Not Found
```bash
# Ensure model.h5 exists in backend directory
# File should be ~200MB
```

### CORS Errors
```bash
# Make sure BACKEND_CORS_ORIGINS in .env includes frontend URL
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Emotion Not Detecting Correctly
- Ensure good lighting
- Face should be centered and clear
- Try different angles and expressions

## Next Steps

1. ✅ Complete current implementation
2. 🔄 Add Spotify API for real music recommendations
3. 📊 Add analytics dashboard
4. 🔐 Implement proper user authentication
5. 📱 Create mobile app version
6. 🌍 Add more language support
7. 🎨 Customize theme/branding

## Support

For issues:
1. Check console errors (Browser DevTools)
2. Check terminal logs (Backend/Frontend)
3. Verify MongoDB is running
4. Check `.env` configuration
5. Ensure both services are running on correct ports

## Documentation

- Full setup guide: `README_SETUP.md`
- API documentation: In backend `routes.py`
- Database schema: In `mongo_db.py`

Enjoy using MoodTunes! 🎵😊
