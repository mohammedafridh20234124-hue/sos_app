# Student Feedback Feature - Quick Reference

## 🎯 Quick Start

### For Students (Using the Feature)
1. Open the Student Dashboard at `http://localhost:8080/dashboard`
2. Click the **☰ Menu** button (top right)
3. Click **"Send Feedback"** option
4. Type your feedback message in the text area
5. Click **"Send Feedback"** button
6. See success confirmation toast

### For Administrators (Receiving Feedback)
1. Configure `.env` with `ADMIN_PHONE_NUMBER=+1-XXX-XXX-XXXX`
2. Ensure Twilio credentials are set (already configured)
3. Receive SMS on the configured phone number when students submit feedback

---

## 📝 API Endpoint

```
POST http://localhost:3001/api/feedback
Content-Type: application/json

{
  "studentName": "John Doe",
  "studentId": "uuid-string",
  "feedbackMessage": "Your feedback text here"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Feedback sent successfully",
  "timestamp": "2025-12-08T20:45:30.123Z"
}
```

### Error Response (400)
```json
{
  "error": "Missing required fields",
  "required": ["studentName", "studentId", "feedbackMessage"]
}
```

---

## 📱 SMS Format Received by Admin

```
📢 Student Feedback Received
Student: John Doe
ID: student-id-12345
Message:
"This is my feedback about the campus security system"
Timestamp: 12/8/2025, 8:45 PM
```

---

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Twilio Credentials (already configured)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=23c05ac59ea648bc78e99ddb0efb496c
TWILIO_PHONE_NUMBER=+14149732941

# Admin Phone Number (receive feedback SMS)
ADMIN_PHONE_NUMBER=+1-800-555-0100
```

---

## 🔍 Verification

### Frontend
- ✅ FeedbackModal component created
- ✅ Menu button shows "Send Feedback" option
- ✅ Modal opens with form and security disclaimer
- ✅ Input validation prevents empty submissions
- ✅ Toast notifications show status
- ✅ Dark/light theme support

### Backend
- ✅ POST `/api/feedback` endpoint available
- ✅ Input validation on server side
- ✅ Twilio SMS integration working
- ✅ Error handling with fallback logging
- ✅ Server logs show feedback received

### Testing
To test locally:
```bash
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Test Student",
    "studentId": "test-123",
    "feedbackMessage": "This is test feedback"
  }'
```

---

## 🎨 UI Components Used

| Component | Purpose |
|-----------|---------|
| Dialog | Modal container |
| Textarea | Message input |
| Button | Submit/Cancel buttons |
| Toast | Notification |
| AlertCircle | Security disclaimer icon |

All styled with Tailwind CSS and shadcn/ui theming.

---

## 🔐 Security Features

- ✅ Input validation (required fields)
- ✅ Empty submission prevention
- ✅ Student ID included for audit trail
- ✅ Timestamp recorded for tracking
- ✅ Environment variable for admin phone (not hardcoded)
- ✅ Error messages don't expose system details

---

## 📊 Server Logs

When feedback is submitted, you'll see:
```
📢 [api/feedback] Feedback received from student: John Doe (uuid-123)
   Message: This is my feedback about...
✓ Feedback SMS sent to admin (+1-800-555-0100)
  Message SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal not opening | Check browser console for errors |
| SMS not received | Verify ADMIN_PHONE_NUMBER in .env |
| "Invalid phone number" | Use E.164 format: +1234567890 |
| Twilio not configured | Check TWILIO_* env vars in .env |
| Submit button disabled | Ensure feedback text is not empty |

---

## 📁 File Locations

- **Frontend Component:** `src/components/FeedbackModal.tsx`
- **Backend Endpoint:** `server/sms-service.mjs` (search for `/api/feedback`)
- **Configuration:** `.env` and `.env.example`
- **Student Dashboard:** `src/pages/StudentDashboard.tsx`

---

## ⭐ Key Features

1. **User-Friendly UI** - Clean, modern modal interface
2. **Theme Support** - Works in dark and light modes
3. **Input Validation** - Prevents empty submissions
4. **Loading States** - Shows spinner during submission
5. **Success Feedback** - Toast notification confirms delivery
6. **Error Handling** - Graceful fallback if SMS unavailable
7. **Secure** - ADMIN_PHONE_NUMBER from environment
8. **Logged** - All feedback logged to console for review

---

## 🚀 What Happens Behind the Scenes

1. **Student clicks "Send Feedback"**
   - FeedbackModal component opens
   - Modal is themed based on current theme preference

2. **Student types feedback and clicks submit**
   - Frontend validates: message not empty
   - Loading spinner appears
   - POST request sent to `/api/feedback`

3. **Backend receives request**
   - Validates required fields
   - Calls `sendFeedbackNotification()` function
   - Formats professional SMS message

4. **Twilio sends SMS**
   - Admin receives SMS with full feedback
   - Message includes student name, ID, message, and timestamp

5. **Response sent to frontend**
   - Success toast displayed
   - Modal closes
   - Form resets

---

## 💡 Tips

- Students can include sensitive information in feedback
- Admin phone number should be monitored for new feedback
- Store feedback SMS externally if permanent record needed
- Can test API with curl or Postman
- Check server logs for debugging

