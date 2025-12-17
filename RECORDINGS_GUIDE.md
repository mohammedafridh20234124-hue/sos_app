# Live Recordings - Admin Guide

## Overview

The **Live Recordings** section in the Admin Dashboard displays all video frames (photos) and audio clips captured during emergency alerts. These recordings are automatically collected when students trigger an SOS alert.

## How to View Recordings

### Step 1: Access the Admin Dashboard
- Log in as an admin
- Navigate to `Admin Dashboard`

### Step 2: Find the Live Recordings Section
- Scroll to the "Live Recordings" card
- This section shows students with captured media

### Step 3: View a Student's Recordings
When recordings exist, you'll see:

1. **Student List View**
   - Each student who has triggered an alert is listed
   - Shows:
     - Student name
     - Student ID
     - 📸 Number of photos captured
     - 🔊 Number of audio clips captured
   - Click the **👁️ View Recordings** button to display that student's media

2. **Student Recording Detail View**
   - **Photos Section**: Grid of captured video frames
     - Click **Open Photo** to view full resolution
     - Click **Delete** to remove individual photos
     - Use **Delete All Photos** to remove all photos for this student
   
   - **Audio Clips Section**: List of captured audio
     - Use browser controls to play/pause audio
     - Click **Play Audio** to open the clip
     - Click **Delete** to remove individual clips
     - Use **Delete All Audio** to remove all audio for this student

## Key Features

### Refresh Button 🔄
- Located in the top-right corner of the Live Recordings card
- Click to reload the latest recordings from the server
- Useful for checking new media without refreshing the page

### Back to List Button
- Returns to the student list view
- Allows you to switch between different students' recordings

### Empty State Message
- If no recordings exist, you'll see a helpful message
- Recordings appear after:
  1. A student triggers an emergency alert
  2. The system captures video frames and audio
  3. The media is transmitted to the server

## Technical Details

### Recording Flow
1. Student triggers SOS alert on their device
2. `LiveRecorder` component starts capturing:
   - Video frames (converted to photos)
   - Audio stream from device microphone
3. Frames and audio are sent to the backend API (`/api/receive`)
4. Server stores them in memory organized by student ID
5. Admin can view via `/api/recordings` endpoint

### API Endpoints
- `GET /api/recordings` - Get all recordings from all students
- `GET /api/recordings?userId={id}` - Get specific student's recordings
- `GET /api/photo/{id}` - Fetch specific photo
- `GET /api/audio/{id}` - Fetch specific audio clip
- `POST /api/recordings/clear` - Delete all recordings
- `POST /api/recordings/clear?userId={id}` - Delete specific student's recordings

### Data Storage
- Currently uses in-memory storage (server RAM)
- Limited to 100 items per category per user
- Data is cleared when server restarts
- For production, integrate with database (Supabase)

## Troubleshooting

### No Recordings Appear
- ✅ Check that at least one emergency alert has been created
- ✅ Verify backend server is running (`npm run server`)
- ✅ Check browser console (F12) for errors
- ✅ Click the 🔄 **Refresh** button to reload

### Recordings Not Loading
- Ensure the backend API is accessible at `http://localhost:3001`
- Check network tab in browser developer tools
- Verify no CORS errors are present
- Try refreshing the page

### Photos Not Displaying
- Photos are stored as JPEG in the API
- Browser cache may be outdated
- Try opening in incognito/private window
- Check that photo ID is valid

### Audio Won't Play
- Audio is stored as WebM format
- Check browser supports WebM audio
- Try using Chrome, Edge, or Firefox
- Download the audio file if playback fails

## Tips & Best Practices

1. **Regular Monitoring**
   - Check the Live Recordings section regularly during active alerts
   - Use the 🔄 Refresh button to get the latest updates

2. **Storage Management**
   - Delete old recordings periodically to manage server memory
   - Use "Delete All" buttons for bulk cleanup

3. **Evidence Preservation**
   - Download important recordings before deleting
   - Keep backups for incident reports

4. **Performance**
   - If many recordings exist, filter by specific students
   - Close the admin dashboard tab if not monitoring to reduce bandwidth

## Integration with Future Features

### Database Storage
To transition from in-memory storage to database:
1. Create Supabase table for recordings metadata
2. Store file content in Supabase Storage bucket
3. Update API endpoints in `server/sms-service.mjs`
4. Reference: `supabase/migrations/` directory

### File Archival
Implement automatic archival:
- Move old recordings to cold storage after 30 days
- Compress audio/video files
- Export to external storage

### Advanced Features
- Real-time preview of live recording streams
- Automatic transcription of audio
- Snapshot extraction at key moments
- Multi-angle recording support

---

**Last Updated**: December 3, 2025
**System**: SOS Campus Security - Emergency Alert System
