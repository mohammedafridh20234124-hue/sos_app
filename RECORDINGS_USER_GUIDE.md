# Live Recordings Feature - Quick Reference

## Overview
The Live Recordings section in the AdminDashboard allows admins to view, manage, and delete emergency recordings (photos and audio) captured from students' devices.

## How It Works

### Step 1: View All Students with Recordings
1. Open AdminDashboard
2. Scroll to "Live Recordings" section
3. See list of students organized by recording count
   - Shows: Student name, ID, number of photos and audio clips

### Step 2: View Specific Student's Recordings
1. Click **"👁️ View Recordings"** button on a student card
2. The view changes to show that student's recordings:
   - **Photos Section**: Grid layout with thumbnails (4 columns on desktop)
   - **Audio Section**: Audio player controls for each clip

### Step 3: Manage Individual Recordings

#### View/Download a Photo
- Click **"Open Photo"** button to view or download the image

#### Play/Download Audio
- Use audio player controls to listen
- Click **"Download"** to save the audio file

#### Delete Individual Recording
1. Click the **trash icon** (🗑️) on the photo or audio clip
2. Confirm deletion in the popup dialog
3. File immediately disappears from the view

### Step 4: Bulk Operations

#### Delete All Photos
1. Click **"Delete All Photos"** button (appears when photos exist)
2. All photos are removed and you get a confirmation

#### Delete All Audio
1. Click **"Delete All Audio"** button (appears when audio exists)
2. All audio clips are removed and you get a confirmation

### Step 5: Return to Student List
1. Click **"✕ Close"** button in the header
2. Returns to the list of all students with recordings
3. List automatically refreshes to show latest data

## Button Reference

### In Recording List View
| Button | Function |
|--------|----------|
| 🔄 Refresh | Reload the list of all students with recordings |
| 👁️ View Recordings | Show photos and audio from selected student |

### In Recording Detail View
| Button | Function |
|--------|----------|
| 🔄 Refresh | Reload current student's recordings |
| ✕ Close | Return to student list view |

### For Individual Recordings
| Button | Function |
|--------|----------|
| Open Photo | View and download the image |
| Download | Save audio file to device |
| 🗑️ (Trash Icon) | Delete this specific file |

### For Bulk Operations
| Button | Function |
|--------|----------|
| Delete All Photos | Remove all photos for this student |
| Delete All Audio | Remove all audio for this student |

## Key Features

✅ **Persistent View**: The recording detail view stays open until you close it (doesn't auto-close)

✅ **Optimistic Updates**: Deleted files disappear immediately from the UI

✅ **Responsive Design**: Works on desktop, tablet, and mobile devices

✅ **Smart Polling**: Only refreshes the student list, not the detail view (prevents interruptions)

✅ **Error Handling**: Gracefully handles network issues and shows user-friendly error messages

✅ **Confirmation Dialogs**: Prevents accidental deletion with confirmation prompts

## Troubleshooting

### Issue: Recordings not appearing
- **Solution**: Click the "🔄 Refresh" button to reload
- Check that students have triggered emergency alerts
- Verify the backend server is running on port 3001

### Issue: Can't delete a recording
- **Solution**: Make sure you've confirmed the deletion dialog
- Check browser console for error messages
- Try refreshing the page

### Issue: Audio won't play
- **Solution**: Try a different browser
- Check browser's audio permissions
- Verify the backend server is running

### Issue: Photos loading slowly
- **Solution**: Wait a moment for thumbnails to load
- Check your internet connection
- Close and reopen the recordings view

## Data Retention

- **Automatic Cleanup**: Old recordings are kept for 24 hours then auto-deleted
- **Manual Delete**: You can delete recordings immediately using the delete buttons
- **Export First**: Download important recordings before deleting

## Performance Tips

1. Don't keep too many recordings open at once (>100 items can slow down the UI)
2. Close the recording detail view when done to resume automatic list updates
3. Clear old recordings regularly to keep storage optimized
4. Use filters/search if available to find specific recordings

## Keyboard Shortcuts (Future)
- `ESC`: Close recording detail view (currently use Close button)
- `Delete`: Delete selected recording (currently use delete button)

## Settings

### Recording Storage Location
- Backend: `/server/uploads/` directory
- In-memory cache: Max 100 items per student

### Polling Interval
- List view: Updates every 3 seconds when NOT viewing detail
- Detail view: Updates paused to prevent interruption

### File Size Limits
- Photos: Up to 5MB each
- Audio: Up to 10MB each
- Total per student: Up to 100MB

## Support

If you encounter issues:
1. Check the browser console for error messages (F12)
2. Verify both servers are running (Frontend: 8080, Backend: 3001)
3. Review error messages in the toast notifications
4. Check documentation in `RECORDINGS_UI_IMPROVEMENTS.md`

## Related Features

- **Emergency Alerts**: Trigger alerts to start recording
- **Student Dashboard**: Where students see their own recordings
- **Email/SMS Notifications**: Alerts sent when emergencies occur
- **Real-time Monitoring**: Live location tracking during emergencies
