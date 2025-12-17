# Testing the Live Recordings Feature

## Quick Start - Generate Test Recordings

Since the system requires actual emergency alerts to generate recordings, this guide shows how to test the recordings feature.

## Option 1: Trigger a Real Emergency Alert (Recommended)

### On the Student Dashboard:
1. Log in as a student
2. Navigate to Student Dashboard
3. Click **🚨 TRIGGER SOS EMERGENCY ALERT**
4. Your device camera/microphone will start recording
5. Wait 10-30 seconds for some frames and audio to be captured
6. The system will send recordings to the server

### View the Recordings:
1. Switch to Admin Dashboard (or use another browser tab)
2. Navigate to **Live Recordings** section
3. You should see your student name listed with:
   - 📸 Number of photos captured
   - 🔊 Number of audio clips
4. Click **👁️ View Recordings**
5. See the captured photos and audio clips!

## Option 2: Direct API Testing

### Check if Server is Running:
```bash
# Terminal command
Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET
```

### Get All Recordings:
```bash
# Terminal command
Invoke-WebRequest -Uri "http://localhost:3001/api/recordings" -Method GET | Select-Object -ExpandProperty Content
```

Expected response:
```json
{
  "success": true,
  "users": [
    {
      "userId": "c3a3c735-0dd3-421e-aa57-a2b88da658e9",
      "userName": "jasmanth",
      "recordings": 5,
      "photos": 2,
      "audioClips": 2
    }
  ],
  "total": {
    "totalUsers": 1,
    "totalRecordings": 5,
    "totalPhotos": 2,
    "totalAudioClips": 2
  }
}
```

### Get Specific Student's Recordings:
```bash
# Replace USER_ID with actual student ID
$userId = "c3a3c735-0dd3-421e-aa57-a2b88da658e9"
Invoke-WebRequest -Uri "http://localhost:3001/api/recordings?userId=$userId" -Method GET | Select-Object -ExpandProperty Content
```

### Download a Photo:
```bash
$photoUrl = "http://localhost:3001/api/photo/photo-id-here"
Invoke-WebRequest -Uri $photoUrl -OutFile "C:\temp\photo.jpg"
```

### Download Audio Clip:
```bash
$audioUrl = "http://localhost:3001/api/audio/audio-id-here"  
Invoke-WebRequest -Uri $audioUrl -OutFile "C:\temp\audio.webm"
```

## Option 3: Mock Data Injection (Development)

If you want to test without triggering actual alerts, you can manually inject test data into the server's in-memory storage.

### Add Test Data via Server Script:

Create a file `test-recordings.mjs` in the `server/` directory:

```javascript
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE = 'http://localhost:3001';
const STUDENT_ID = 'test-student-id-' + Date.now();
const STUDENT_NAME = 'Test Student ' + Date.now();

// Generate test photo (1x1 red pixel JPEG)
const testPhotoBuffer = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
  0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
  0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
  0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
  0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
  0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
  0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
  0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
  0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
  0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
  0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
  0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
  0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
  0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
  0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
  0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
  0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD0, 0xFF, 0xD9
]);

async function sendTestRecording() {
  try {
    console.log('📤 Sending test recording...');
    
    // Create FormData
    const formData = new FormData();
    formData.append('userId', STUDENT_ID);
    formData.append('userName', STUDENT_NAME);
    formData.append('photo', testPhotoBuffer, { filename: 'test-photo.jpg', contentType: 'image/jpeg' });
    formData.append('location', JSON.stringify({
      latitude: 40.1164,
      longitude: -88.2434,
      accuracy: 10
    }));
    formData.append('timestamp', new Date().toISOString());
    
    // Send to server
    const response = await fetch(`${API_BASE}/api/receive`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('✅ Test recording sent:', result);
    
    // Check recordings
    console.log('\n📹 Fetching recordings...');
    const recordingsResponse = await fetch(`${API_BASE}/api/recordings`);
    const recordings = await recordingsResponse.json();
    console.log('✅ Current recordings:', JSON.stringify(recordings, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendTestRecording();
```

### Run the test script:
```bash
cd server
node test-recordings.mjs
```

Then check the Admin Dashboard to see the test recordings appear!

## What to Look For

After triggering an alert or sending test data, you should see:

1. **Live Recordings Card Updated**
   - Student name appears
   - Photo count shows (e.g., "📸 2 photos")
   - Audio count shows (e.g., "🔊 2 audio clips")

2. **View Recordings Button**
   - Should be clickable and prominent
   - Clicking shows the student's media

3. **Recording Details**
   - Photos displayed in a grid
   - Audio clips with play controls
   - Timestamps for each recording
   - File sizes displayed

## Performance Testing

### Test with Multiple Students

Create multiple test students to verify the UI handles:
- Multiple students in the list
- Scrolling performance
- Large image grids
- Multiple audio players

### Monitor Server Performance

Check the backend terminal output:
```
📹 Fetching recordings (all users)
✅ Returning data: {
  totalUsers: 2,
  totalRecordings: 10,
  totalPhotos: 5,
  totalAudioClips: 5
}
```

## Troubleshooting Test Setup

| Issue | Solution |
|-------|----------|
| "Cannot connect to API" | Check backend server: `npm run server` |
| Test data not appearing | Refresh Admin Dashboard page (F5) |
| Photos show as gray boxes | Check browser console for image load errors |
| Audio won't play | Verify browser supports WebM audio format |
| Server crashes | Check RAM usage; in-memory storage has limits |

---

**Next Steps:**
1. Test the Live Recordings feature with real alerts
2. Verify all recording types work (photos, audio)
3. Test deletion functionality
4. Prepare for production database integration
