# Testing Guide - MoodTunes

## Pre-Testing Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 14+ installed
- [ ] MongoDB installed and running
- [ ] All dependencies installed (npm install & pip install)
- [ ] `.env` file created with configuration
- [ ] Camera/webcam available on device

## Starting the Application

### Terminal 1 - Backend
```bash
cd backend
source venv/Scripts/activate  # Windows: venv\Scripts\activate
python app.py
# Should print: "Connected to MongoDB: moodtunes"
# Should run on: http://localhost:5000
```

### Terminal 2 - Frontend
```bash
cd frontend/moodtunes-react
npm start
# Should open: http://localhost:3000
```

## Test Scenarios

### Test 1: Basic Navigation

**Objective**: Verify page navigation works correctly

**Steps**:
1. Open http://localhost:3000
2. Click "Get Started Free" button
   - ✅ Should navigate to /setup (SetupPage)
3. On SetupPage, verify elements visible:
   - ✅ Language selector dropdown
   - ✅ Region selector dropdown
   - ✅ "Start Emotion Detection" button
4. Scroll down to verify history section
   - ✅ History section visible
   - ✅ "Your History" title with count
5. Click "Start Emotion Detection" button
   - ✅ Should navigate to /experience (ExperiencePage)

**Expected Result**: ✅ All navigation works smoothly

---

### Test 2: Setup Page - Language & Region Selection

**Objective**: Verify language and region dropdowns work

**Steps**:
1. Navigate to SetupPage (/setup)
2. Test Language selector:
   - Click dropdown
   - ✅ Should see 6 options (English, Hindi, Spanish, French, German, Portuguese)
   - Select "Hindi"
   - ✅ Value should change to "hi"
3. Test Region selector:
   - Click dropdown
   - ✅ Should see 6 options (India, US, UK, Canada, Australia, Germany)
   - Select "US"
   - ✅ Value should change to "US"
4. Leave selection on these values
5. Click "Start Emotion Detection"
   - ✅ Should navigate to ExperiencePage
   - ✅ Language and region should be pre-filled

**Expected Result**: ✅ Selections work and persist

---

### Test 3: Experience Page - Interface Check

**Objective**: Verify ExperiencePage UI elements

**Steps**:
1. Navigate to ExperiencePage (/experience)
2. Verify left panel (Preferences):
   - ✅ Language selector with 6 options
   - ✅ Region selector with 6 options
   - Values should be from SetupPage: Language="hi", Region="US"
3. Verify right panel (Detector):
   - ✅ "Capture Your Expression" heading
   - ✅ Video/camera preview area
   - ✅ "Detect Emotion & Get Recommendations" button
4. Scroll down to "How It Works" section
   - ✅ 5 step-by-step instructions visible

**Expected Result**: ✅ All UI elements present and correctly styled

---

### Test 4: Camera/Image Capture

**Objective**: Test camera functionality and image capture

**Prerequisites**: 
- Browser camera permissions granted
- Good lighting available
- Clear face visible to camera

**Steps**:
1. On ExperiencePage, verify camera is working
   - ✅ Video feed should be visible in preview area
   - ✅ Should see your face in real-time
2. Adjust lighting if needed
3. Click "Detect Emotion & Get Recommendations" button
   - ⏳ Wait for processing...
   - Look for: Button becomes "Detecting..."
   - ✅ Emotion detection process starts

**Expected Result**: ✅ Camera captures image and sends to backend

---

### Test 5: Emotion Detection & Backend Processing

**Objective**: Test emotion detection and recommendations

**Prerequisites**: 
- Image captured successfully from Test 4
- Backend is running and connected to MongoDB

**Expected Frontend Results**:
- ✅ Emotion detected (e.g., "happy", "sad", etc.)
- ✅ Confidence score shown (e.g., "95.3%")
- ✅ Large emotion emoji displayed (😊, 😢, etc.)
- ✅ "Recommended Songs" section visible
- ✅ At least 5-10 song cards displayed
- ✅ Each song shows: Track number, name, artist, album

**Expected Backend Results**:
Check terminal for:
- ✅ POST request to `/api/detect` logged
- ✅ Emotion detection successful
- ✅ MongoDB save successful
- ✅ Response with emotion and tracks

**Expected Result**: ✅ Full emotion detection flow works end-to-end

---

### Test 6: Music Recommendations Display

**Objective**: Verify recommendation cards are properly formatted

**Steps**:
1. Look at displayed recommendations
2. For each card, verify:
   - ✅ Number badge (1, 2, 3, etc.)
   - ✅ Track name
   - ✅ Artist name(s)
   - ✅ Album name
   - ✅ 🎵 Listen button (Spotify link)
3. Click on one "Listen" button
   - ✅ Should open Spotify URL in new tab (when Spotify API connected)
   - Note: Currently shows placeholder data

**Expected Result**: ✅ Recommendations display correctly

---

### Test 7: History Tracking (MongoDB)

**Objective**: Verify emotion sessions are saved to MongoDB

**Steps**:
1. Complete emotion detection (Test 5)
2. Navigate back to SetupPage (/setup)
3. Scroll to "Your History" section
   - ✅ Section should now show 1 record
   - ✅ Should see emotion emoji and emotion name
   - ✅ Should see confidence percentage
   - ✅ Should see region (US from earlier test)
   - ✅ Should see date/time of detection
4. Click on history item
   - ✅ Should navigate back to ExperiencePage
   - ✅ Preferences should be pre-filled from history

**MongoDB Verification**:
```bash
# Connect to MongoDB
mongosh

# Check database
use moodtunes
db.mood_records.find().pretty()

# Should see document with:
# - email (or null if not logged in)
# - detected_emotion: "happy" (or detected emotion)
# - confidence: 0.95 (or actual confidence)
# - region: "US"
# - language: "hi"
# - created_at: ISODate
```

**Expected Result**: ✅ Records saved to MongoDB and visible in history

---

### Test 8: Multiple Emotion Detections

**Objective**: Test multiple consecutive detections

**Steps**:
1. Make sure you're in SetupPage
2. View history count (should be 1 from Test 7)
3. Click "Start Emotion Detection"
4. Change your facial expression (try to look sad)
5. Click "Detect Emotion & Get Recommendations"
6. Verify different emotion detected
7. Navigate back to SetupPage
8. Verify history now shows 2 records
9. Verify both records visible with correct emotions

**Expected Result**: ✅ Multiple records tracked correctly

---

### Test 9: Error Handling

**Objective**: Test error messages and handling

**Test 9a - No Face Detected**:
1. In ExperiencePage, cover your face
2. Click "Detect Emotion & Get Recommendations"
3. ✅ Error message should appear: "No face detected..."
4. ✅ Recommendations section should not appear

**Test 9b - Backend Not Running**:
1. Stop backend server
2. Try to detect emotion
3. ✅ Error message should appear
4. ✅ Specific error should be shown

**Test 9c - MongoDB Connection Error**:
1. Stop MongoDB
2. Detect emotion (backend still running)
3. ✅ Frontend shows success (emotion detected)
4. ✅ Backend logs MongoDB connection error
5. ✅ Graceful degradation (recommendations still shown)

**Expected Result**: ✅ Errors handled gracefully

---

### Test 10: Responsive Design

**Objective**: Test on different screen sizes

**Mobile (320px width)**:
1. Open DevTools (F12)
2. Set device to iPhone SE
3. Verify:
   - ✅ SetupPage stacks language/region above history
   - ✅ History items reflow properly
   - ✅ Buttons are clickable
   - ✅ Text is readable

**Tablet (768px width)**:
1. Set device to iPad
2. Verify:
   - ✅ Two-column layout maintained
   - ✅ Text sizing appropriate
   - ✅ Camera preview visible

**Desktop (1920px width)**:
1. Maximize browser window
2. Verify:
   - ✅ Full layout displayed
   - ✅ All elements visible
   - ✅ Proper spacing maintained

**Expected Result**: ✅ Works on all screen sizes

---

### Test 11: API Endpoints (Postman/cURL)

**Objective**: Verify all API endpoints work correctly

**Test Detect Endpoint**:
```bash
curl -X POST http://localhost:5000/api/detect \
  -H "Content-Type: application/json" \
  -d '{
    "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "metadata": {
      "email": "test@example.com",
      "name": "Test User",
      "region": "IN",
      "language": "en"
    },
    "limit": 5
  }'
```
✅ Should return: `{ emotion, confidence, tracks }`

**Test History Endpoint**:
```bash
curl http://localhost:5000/api/history?email=test@example.com&limit=10
```
✅ Should return: `{ records: [...], total: count }`

**Test Preferences Endpoint (GET)**:
```bash
curl http://localhost:5000/api/user/preferences?email=test@example.com
```
✅ Should return: `{ email, name, preferred_language, preferred_region, ... }`

**Test Preferences Endpoint (POST)**:
```bash
curl -X POST http://localhost:5000/api/user/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "preferred_language": "en",
    "preferred_region": "IN"
  }'
```
✅ Should return: `{ message: "Preferences updated successfully" }`

**Expected Result**: ✅ All endpoints return correct responses

---

### Test 12: Data Persistence

**Objective**: Verify data persists after refresh

**Steps**:
1. Navigate to SetupPage
2. Verify history shows your records
3. Press F5 (page refresh)
4. ✅ History should still be visible
5. Verify same number of records shown
6. Check browser console:
   - ✅ No CORS errors
   - ✅ Fetch request to `/api/history` succeeded

**Expected Result**: ✅ Data persists across page refreshes

---

## Performance Testing

### Page Load Time
1. Open Chrome DevTools → Network tab
2. Navigate to SetupPage
3. Check load time:
   - ✅ Page should load in < 2 seconds
   - ✅ History should load in < 1 second

### Backend Response Time
1. Measure emotion detection time
2. Expected:
   - ✅ Image upload: < 100ms
   - ✅ Emotion detection: < 1s
   - ✅ MongoDB save: < 100ms
   - ✅ Total response: < 1.5s

---

## Accessibility Testing

1. **Keyboard Navigation**
   - ✅ Tab through all buttons and inputs
   - ✅ All elements should be focusable
   - ✅ Enter should activate buttons

2. **Color Contrast**
   - ✅ Text should be readable
   - ✅ Use WCAG contrast checker

3. **Screen Reader**
   - ✅ Test with browser accessibility inspector

---

## Regression Testing Checklist

After making changes, verify:
- [ ] All 12 test scenarios still pass
- [ ] No console errors
- [ ] MongoDB data still saves
- [ ] Navigation still works
- [ ] API endpoints still respond
- [ ] Mobile view works
- [ ] Performance not degraded

---

## Known Limitations

- ⚠️ Spotify integration shows placeholder data (not connected to real API yet)
- ⚠️ Authentication is basic (localStorage only, no server-side session)
- ⚠️ Image is base64 encoded (could be optimized for larger images)
- ⚠️ No rate limiting implemented

---

## Troubleshooting During Testing

### Issue: Camera not working
- Solution: Check browser permissions in DevTools console

### Issue: Backend connection refused
- Solution: Verify backend is running on port 5000

### Issue: MongoDB error
- Solution: Check `mongod` is running, check MONGODB_URL in .env

### Issue: CORS error in console
- Solution: Verify BACKEND_CORS_ORIGINS includes localhost:3000

### Issue: History not loading
- Solution: Check Network tab in DevTools for failed requests

### Issue: Emotion never detected
- Solution: Ensure good lighting, clear face visible, try different angles

---

## Testing Report Template

```
Date: ___________
Tester: ___________
Environment: Frontend: _____ Backend: _____ MongoDB: _____

Test Results:
Test 1 - Navigation: ✅ / ❌
Test 2 - Language/Region: ✅ / ❌
Test 3 - UI Elements: ✅ / ❌
Test 4 - Camera: ✅ / ❌
Test 5 - Emotion Detection: ✅ / ❌
Test 6 - Recommendations: ✅ / ❌
Test 7 - History: ✅ / ❌
Test 8 - Multiple Detections: ✅ / ❌
Test 9 - Error Handling: ✅ / ❌
Test 10 - Responsive Design: ✅ / ❌
Test 11 - API Endpoints: ✅ / ❌
Test 12 - Data Persistence: ✅ / ❌

Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

Overall Status: ✅ PASS / ❌ FAIL
```

---

Happy Testing! 🎉
