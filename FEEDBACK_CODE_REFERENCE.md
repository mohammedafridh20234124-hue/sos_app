# Student Feedback Feature - Code Reference

## 📋 Complete Implementation Guide

### 1. FeedbackModal Component (Frontend)

**File:** `src/components/FeedbackModal.tsx`

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, AlertCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
}

export const FeedbackModal = ({
  isOpen,
  onClose,
  studentName,
  studentId,
}: FeedbackModalProps) => {
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  const handleSubmit = async () => {
    if (!feedbackMessage.trim()) {
      toast({
        title: "Empty Feedback",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_ADMIN_SERVER_URL?.replace('/api/receive', '') || 'http://localhost:3001'}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName,
          studentId,
          feedbackMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send feedback");
      }

      toast({
        title: "Feedback Sent Successfully!",
        description: "Your feedback has been sent securely to the campus safety team.",
        className: theme === 'dark' ? 'bg-green-900/80 border-green-700' : 'bg-green-50 border-green-200',
      });

      setFeedbackMessage("");
      onClose();
    } catch (error: any) {
      console.error("Error sending feedback:", error);
      toast({
        title: "Failed to Send Feedback",
        description: error.message || "An error occurred while sending your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`backdrop-blur-lg rounded-2xl shadow-2xl max-w-md ${
        theme === 'dark'
          ? 'bg-slate-900/90 border border-red-500/20'
          : 'bg-white/90 border border-gray-200/50'
      }`}>
        <DialogHeader>
          <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            Send Feedback
          </DialogTitle>
          <DialogDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Share your feedback with the campus safety team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${
            theme === 'dark'
              ? 'bg-blue-900/30 border-blue-500/30'
              : 'bg-blue-50/60 border-blue-200/50'
          }`}>
            <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <p className={`text-sm ${
              theme === 'dark' ? 'text-blue-200' : 'text-blue-800'
            }`}>
              Your feedback will be sent securely to the campus safety team.
            </p>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Your Feedback
            </label>
            <Textarea
              placeholder="Please share your feedback or concerns..."
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              className={`resize-none border ${
                theme === 'dark'
                  ? 'bg-slate-800 border-red-500/20 text-white placeholder:text-gray-500'
                  : 'bg-white border-gray-300/50 text-gray-900 placeholder:text-gray-500'
              }`}
              rows={5}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className={theme === 'dark'
              ? 'bg-slate-800/60 border-red-500/30 hover:bg-slate-800/80 text-white'
              : 'bg-gray-100 border-gray-300/50 hover:bg-gray-200 text-gray-900'
            }
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !feedbackMessage.trim()}
            className={`gap-2 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Feedback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

### 2. StudentDashboard Integration

**File:** `src/pages/StudentDashboard.tsx` (Key Changes)

```typescript
// Import the FeedbackModal component
import { FeedbackModal } from "@/components/FeedbackModal";

// Add state for feedback modal
const [showFeedbackModal, setShowFeedbackModal] = useState(false);

// In the menu JSX, add the feedback button:
<button
  onClick={() => {
    setShowFeedbackModal(true);
  }}
  className={`w-full flex items-center gap-3 px-4 py-3 border-b transition-colors ${
    theme === 'dark'
      ? 'hover:bg-red-600/20 border-red-500/20 text-white'
      : 'hover:bg-gray-100 border-gray-200/50 text-gray-900'
  }`}
>
  <MessageSquare className={`h-4 w-4 ${theme === 'dark' ? 'text-red-400' : 'text-gray-700'}`} />
  <span className="text-sm font-medium">Send Feedback</span>
</button>

// At the end of the component JSX, before closing tag:
<FeedbackModal
  isOpen={showFeedbackModal}
  onClose={() => setShowFeedbackModal(false)}
  studentName={profile?.first_name || user?.email || "Student"}
  studentId={user?.id || ""}
/>
```

---

### 3. Backend Feedback Endpoint

**File:** `server/sms-service.mjs`

```javascript
// ==================== Student Feedback Endpoint ====================

// Send student feedback to admin via Twilio SMS
app.post('/api/feedback', async (req, res) => {
  try {
    const { studentName, studentId, feedbackMessage } = req.body;

    // Validate input
    if (!studentName || !studentId || !feedbackMessage) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['studentName', 'studentId', 'feedbackMessage'] 
      });
    }

    console.log(`\n📢 [api/feedback] Feedback received from student: ${studentName} (${studentId})`);
    console.log(`   Message: ${feedbackMessage.substring(0, 100)}...`);

    // Send feedback via Twilio SMS
    const success = await sendFeedbackNotification(studentName, studentId, feedbackMessage);

    if (success) {
      res.json({ 
        success: true, 
        message: 'Feedback sent successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send feedback notification',
        details: 'Twilio service may not be configured'
      });
    }
  } catch (error) {
    console.error('❌ Error processing feedback:', error);
    res.status(500).json({ 
      error: 'Failed to process feedback', 
      details: error.message 
    });
  }
});
```

---

### 4. Twilio Notification Function

**File:** `server/sms-service.mjs`

```javascript
// ==================== Twilio Feedback Notification Function ====================

/**
 * Send student feedback notification to admin via Twilio SMS
 * @param {string} studentName - Name of the student providing feedback
 * @param {string} studentId - ID of the student
 * @param {string} feedbackMessage - The feedback message content
 * @returns {Promise<boolean>} - True if notification sent successfully
 */
const sendFeedbackNotification = async (studentName, studentId, feedbackMessage) => {
  try {
    const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // Log if ADMIN_PHONE_NUMBER is not configured
    if (!adminPhoneNumber) {
      console.warn('⚠️ ADMIN_PHONE_NUMBER not configured in environment variables');
      console.log(`📢 Feedback received (SMS not sent):`);
      console.log(`   Student: ${studentName} (${studentId})`);
      console.log(`   Message: ${feedbackMessage}`);
      return true; // Return true since feedback was logged
    }

    if (!twilioClient) {
      console.warn('⚠️ Twilio service not configured');
      console.log(`📢 Feedback received (SMS not sent):`);
      console.log(`   Student: ${studentName} (${studentId})`);
      console.log(`   Message: ${feedbackMessage}`);
      return true; // Return true since feedback was logged
    }

    // Format the feedback message for SMS
    const timestamp = new Date().toLocaleString();
    const feedbackSMS = `📢 Student Feedback Received\nStudent: ${studentName}\nID: ${studentId}\nMessage:\n"${feedbackMessage}"\nTimestamp: ${timestamp}`;

    // Send SMS via Twilio
    const message = await twilioClient.messages.create({
      body: feedbackSMS,
      from: twilioPhoneNumber,
      to: adminPhoneNumber,
    });

    console.log(`✓ Feedback SMS sent to admin (${adminPhoneNumber})`);
    console.log(`  Message SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send feedback notification:', error.message);
    
    // Log feedback for manual review even if Twilio fails
    console.log(`📢 Feedback logged for manual review:`);
    console.log(`   Student: ${studentName} (${studentId})`);
    console.log(`   Message: ${feedbackMessage}`);
    
    return false;
  }
};
```

---

### 5. Environment Configuration

**File:** `.env`

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=23c05ac59ea648bc78e99ddb0efb496c
TWILIO_PHONE_NUMBER=+14149732941
ADMIN_PHONE_NUMBER=+1-800-555-0100
```

---

## 🧪 Testing Examples

### Test with cURL

```bash
# Test feedback submission
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Jane Smith",
    "studentId": "student-uuid-12345",
    "feedbackMessage": "I would like to suggest improving the emergency alert response time."
  }'

# Expected response:
# {"success":true,"message":"Feedback sent successfully","timestamp":"2025-12-08T20:45:30.123Z"}
```

### Test with JavaScript/Fetch

```javascript
// In browser console or Node.js
const sendFeedback = async () => {
  const response = await fetch('http://localhost:3001/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: 'John Doe',
      studentId: 'uuid-123',
      feedbackMessage: 'Great system, very responsive!'
    })
  });
  
  const data = await response.json();
  console.log(data);
};

sendFeedback();
```

### Test with Postman

1. **Method:** POST
2. **URL:** `http://localhost:3001/api/feedback`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (JSON):**
   ```json
   {
     "studentName": "Alex Johnson",
     "studentId": "student-id-456",
     "feedbackMessage": "The location tracking feature works perfectly during emergencies."
   }
   ```

---

## 🔗 API Integration Pattern

### Frontend to Backend Flow

```
FeedbackModal Component
    ↓
handleSubmit() function
    ↓
Fetch POST /api/feedback
    ↓
Backend receives request
    ↓
Validate input
    ↓
Call sendFeedbackNotification()
    ↓
Twilio SMS API
    ↓
Admin receives SMS
    ↓
Response sent to frontend
    ↓
Toast notification displayed
    ↓
Modal closes
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────┐
│  Student Dashboard  │
│   Click "Send       │
│   Feedback" button  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ FeedbackModal Opens │
│ (Theme-aware UI)    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Student enters     │
│  feedback message   │
│  Clicks Submit      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Validate input     │
│  Show loading state │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  POST /api/feedback │
│  (JSON body)        │
└──────────┬──────────┘
           ↓
┌─────────────────────────────┐
│ Backend Receives Request    │
│ - Validate fields           │
│ - Check for empty message   │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│ sendFeedbackNotification()   │
│ - Format SMS message        │
│ - Check ADMIN_PHONE_NUMBER  │
│ - Check Twilio client       │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│ Twilio SMS API              │
│ .messages.create()          │
│ Sends to ADMIN_PHONE_NUMBER │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│ Admin receives SMS          │
│ with formatted feedback     │
│ and student information     │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│ Response: {                 │
│   "success": true,          │
│   "message": "...",         │
│   "timestamp": "..."        │
│ }                           │
└──────────┬──────────────────┘
           ↓
┌─────────────────────────────┐
│ Frontend displays           │
│ Success Toast               │
│ Modal closes                │
│ Form resets                 │
└─────────────────────────────┘
```

---

## 🎯 Key Functions Summary

| Function | Location | Purpose |
|----------|----------|---------|
| `handleSubmit()` | FeedbackModal.tsx | Handles form submission and API call |
| `sendFeedbackNotification()` | sms-service.mjs | Formats and sends SMS via Twilio |
| `POST /api/feedback` | sms-service.mjs | Express endpoint for feedback |

---

## ✨ Advanced Customization

### Change SMS Format

Edit `sendFeedbackNotification()` function in `server/sms-service.mjs`:

```javascript
// Current format:
const feedbackSMS = `📢 Student Feedback Received\nStudent: ${studentName}\nID: ${studentId}\nMessage:\n"${feedbackMessage}"\nTimestamp: ${timestamp}`;

// Custom format example:
const feedbackSMS = `[FEEDBACK] ${studentName} - ${feedbackMessage}`;
```

### Add Email Notification

```javascript
// In sendFeedbackNotification() function, after SMS sending:
if (emailTransporter) {
  await emailTransporter.sendMail({
    to: process.env.ADMIN_EMAIL,
    subject: `Student Feedback from ${studentName}`,
    text: feedbackMessage,
    html: `<p>From: ${studentName} (${studentId})</p><p>${feedbackMessage}</p>`
  });
}
```

### Add Database Storage

```javascript
// In /api/feedback endpoint:
const { data, error } = await supabase
  .from('feedback')
  .insert([{
    student_name: studentName,
    student_id: studentId,
    message: feedbackMessage,
    created_at: new Date()
  }]);
```

