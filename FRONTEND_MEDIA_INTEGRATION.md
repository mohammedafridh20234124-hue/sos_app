# 📡 Frontend Integration Guide - Media Delivery to Admin

## Quick Reference

### 🚨 1. Send Emergency Media During SOS Alert

**When:** Student triggers SOS emergency  
**Where:** SOS Alert component or Emergency Mode page  
**What:** Send captured photos, audio, and video to admin

```javascript
// Send media to admin during emergency
async function sendEmergencyMediaToAdmin(alertId, media) {
  const formData = new FormData();
  
  // Student info
  formData.append('studentName', user.full_name || 'Unknown');
  formData.append('studentId', user.id);
  formData.append('alertId', alertId);
  
  // Location (if available)
  if (location) {
    formData.append('location', JSON.stringify({
      lat: location.latitude,
      lon: location.longitude,
      accuracy: location.accuracy
    }));
  }
  
  // Media files
  if (media.photo) formData.append('photo', media.photo, 'emergency.jpg');
  if (media.audio) formData.append('audio', media.audio, 'emergency.webm');
  if (media.video) formData.append('video', media.video, 'emergency.webm');
  
  try {
    const response = await fetch('http://localhost:3001/api/send-media-to-admin', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('✅ Media sent to admin:', result.mediaCount, 'files');
    return result;
  } catch (error) {
    console.error('❌ Failed to send media:', error);
    throw error;
  }
}

// Usage in SOS Alert
const handleSOSActivation = async () => {
  const emergencyAlertId = createEmergencyAlert();
  
  // Collect media
  const photo = await capturePhotoFrame();
  const audio = await startAudioRecording();
  
  // Send to admin
  await sendEmergencyMediaToAdmin(emergencyAlertId, {
    photo,
    audio,
    video: null // Add video if streaming
  });
};
```

### 📊 2. Retrieve Emergency Media (Admin Dashboard)

**When:** Admin opens emergency alert  
**Where:** Admin Dashboard - Emergency Alerts section  
**What:** Show all media from students

```javascript
// Get all emergency media
async function getEmergencyMedia() {
  try {
    const response = await fetch('http://localhost:3001/api/admin/emergency-media');
    const { data: alerts } = await response.json();
    
    return alerts.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  } catch (error) {
    console.error('❌ Failed to fetch emergency media:', error);
    return [];
  }
}

// Get specific alert media
async function getAlertMedia(alertId) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/admin/emergency-media/${alertId}`
    );
    const { data: alert } = await response.json();
    return alert;
  } catch (error) {
    console.error('❌ Failed to fetch alert media:', error);
    return null;
  }
}

// Display media in admin dashboard
const [emergencyAlerts, setEmergencyAlerts] = useState([]);

useEffect(() => {
  const loadMediaAlerts = async () => {
    const alerts = await getEmergencyMedia();
    setEmergencyAlerts(alerts);
  };
  
  loadMediaAlerts();
  const interval = setInterval(loadMediaAlerts, 5000); // Refresh every 5 seconds
  return () => clearInterval(interval);
}, []);

// Render alerts with media
{emergencyAlerts.map(alert => (
  <div key={alert.alertId} className="alert-card">
    <h3>{alert.studentName}</h3>
    <p>Alert: {alert.alertId}</p>
    <div className="media-grid">
      {alert.media.map(media => (
        <div key={media.id} className="media-item">
          <img 
            src={`http://localhost:3001/api/admin/emergency-media/${alert.alertId}/file/${media.id}`}
            alt={media.originalName}
            onClick={() => downloadMedia(alert.alertId, media.id)}
          />
          <span>{media.type}</span>
        </div>
      ))}
    </div>
  </div>
))}
```

### 💬 3. Send Feedback with Media Attachments

**When:** Student submits feedback  
**Where:** Student Dashboard - Feedback section  
**What:** Send text feedback with optional file attachments

```javascript
// Send feedback with attachments
async function submitFeedbackWithAttachments(
  feedbackMessage,
  attachmentFile = null
) {
  const formData = new FormData();
  
  // Feedback info
  formData.append('studentName', user.full_name || 'Unknown');
  formData.append('studentId', user.id);
  formData.append('feedbackMessage', feedbackMessage);
  
  // Optional attachment
  if (attachmentFile) {
    formData.append('attachment', attachmentFile);
  }
  
  try {
    const response = await fetch('http://localhost:3001/api/feedback', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('✅ Feedback sent:', result.feedbackId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send feedback:', error);
    throw error;
  }
}

// Usage: Simple form
const FeedbackForm = () => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      await submitFeedbackWithAttachments(message, file);
      setMessage('');
      setFile(null);
      // Show success toast
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your feedback..."
      />
      <input 
        type="file"
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <button disabled={sending || !message}>
        {sending ? 'Sending...' : 'Send Feedback'}
      </button>
    </form>
  );
};
```

### 📋 4. Retrieve & Manage Feedback (Admin Dashboard)

**When:** Admin views student feedback  
**Where:** Admin Dashboard - Feedback section  
**What:** Show all feedback with attachments

```javascript
// Get all student feedback
async function getAllFeedback() {
  try {
    const response = await fetch('http://localhost:3001/api/admin/feedback');
    const { data: feedback } = await response.json();
    
    return feedback.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    console.error('❌ Failed to fetch feedback:', error);
    return [];
  }
}

// Download feedback attachment
async function downloadFeedbackAttachment(feedbackId, attachmentId) {
  const url = `http://localhost:3001/api/admin/feedback/${feedbackId}/attachment/${attachmentId}`;
  window.open(url, '_blank');
}

// Mark feedback as read
async function markFeedbackAsRead(feedbackId) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/admin/feedback/${feedbackId}/read`,
      { method: 'POST' }
    );
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to mark as read:', error);
  }
}

// Add admin notes to feedback
async function addFeedbackNotes(feedbackId, notes) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/admin/feedback/${feedbackId}/notes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      }
    );
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to add notes:', error);
  }
}

// Display feedback in admin dashboard
const FeedbackList = () => {
  const [feedback, setFeedback] = useState([]);
  
  useEffect(() => {
    const loadFeedback = async () => {
      const items = await getAllFeedback();
      setFeedback(items);
    };
    
    loadFeedback();
    const interval = setInterval(loadFeedback, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="feedback-list">
      {feedback.map(item => (
        <div key={item.id} className={`feedback-item ${item.read ? 'read' : 'unread'}`}>
          <div className="feedback-header">
            <h3>{item.studentName}</h3>
            <span>{item.studentId}</span>
          </div>
          <p>{item.feedbackMessage}</p>
          
          {item.attachments.length > 0 && (
            <div className="attachments">
              {item.attachments.map(att => (
                <button
                  key={att.id}
                  onClick={() => downloadFeedbackAttachment(item.id, att.id)}
                >
                  📎 {att.originalName} ({(att.size / 1024).toFixed(0)} KB)
                </button>
              ))}
            </div>
          )}
          
          <button onClick={() => markFeedbackAsRead(item.id)}>
            {item.read ? '✓ Read' : 'Mark as Read'}
          </button>
        </div>
      ))}
    </div>
  );
};
```

## API Response Examples

### Emergency Media Upload Response
```json
{
  "success": true,
  "alertId": "alert_1702900800_abc123",
  "mediaCount": 3,
  "media": [
    {
      "id": "media_alert_1702900800_abc123_1702900801_xyz789",
      "type": "image",
      "originalName": "emergency_photo.jpg",
      "mimeType": "image/jpeg",
      "size": 245000,
      "timestamp": "2025-12-18T15:30:45.123Z"
    },
    {
      "id": "media_alert_1702900800_abc123_1702900802_xyz790",
      "type": "audio",
      "originalName": "emergency_audio.webm",
      "mimeType": "audio/webm",
      "size": 125000,
      "timestamp": "2025-12-18T15:30:46.123Z"
    }
  ],
  "timestamp": "2025-12-18T15:30:47.123Z"
}
```

### Get Emergency Media Response
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "alertId": "alert_1702900800_abc123",
      "studentId": "STU123",
      "studentName": "John Doe",
      "location": {
        "lat": 40.7128,
        "lon": -74.0060,
        "accuracy": 5.5
      },
      "createdAt": "2025-12-18T15:30:00.000Z",
      "media": [
        { "id": "media_...", "type": "image", "size": 245000, ... }
      ]
    }
  ]
}
```

### Feedback Submission Response
```json
{
  "success": true,
  "feedbackId": "feedback_1702900800_def456",
  "attachmentCount": 1,
  "timestamp": "2025-12-18T15:30:47.123Z"
}
```

## Error Handling

```javascript
// Comprehensive error handling
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Resource not found');
      } else if (response.status === 500) {
        throw new Error('Server error - try again later');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error - check server connection');
    }
    throw error;
  }
}
```

## Testing Endpoints

### Using Postman or cURL

```bash
# 1. Send emergency media
curl -X POST http://localhost:3001/api/send-media-to-admin \
  -F "studentName=John Doe" \
  -F "studentId=STU123" \
  -F "alertId=alert_test_001" \
  -F "location={\"lat\":40.7128,\"lon\":-74.0060}" \
  -F "photo=@photo.jpg"

# 2. Get all emergency media
curl http://localhost:3001/api/admin/emergency-media

# 3. Get specific alert
curl http://localhost:3001/api/admin/emergency-media/alert_test_001

# 4. Send feedback with attachment
curl -X POST http://localhost:3001/api/feedback \
  -F "studentName=Jane Smith" \
  -F "studentId=STU456" \
  -F "feedbackMessage=Great app!" \
  -F "attachment=@feedback.pdf"

# 5. Get all feedback
curl http://localhost:3001/api/admin/feedback
```

## Performance Tips

1. **Batch Requests:** Get all alerts once instead of individual requests
2. **Lazy Load Media:** Load media thumbnails first, full files on demand
3. **Cache Results:** Cache emergency alerts for 5-10 seconds
4. **Compression:** Compress media before sending (use quality 0.7-0.8)
5. **Background Upload:** Send media in background while showing alert UI

## Security Best Practices

✅ Always validate file types client-side  
✅ Limit file sizes (e.g., max 10MB per file)  
✅ Use HTTPS in production  
✅ Implement authentication before deployment  
✅ Never expose direct file paths to users

---

**Happy coding!** 🚀
