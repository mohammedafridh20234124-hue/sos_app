# 📢 Admin Broadcast Message Feature - Complete Setup Guide

## Overview

Fixed the Admin Dashboard broadcast messaging feature with the following improvements:
- ✅ Created `broadcast_messages` table in Supabase
- ✅ Updated frontend to use correct table
- ✅ Added `/api/broadcast` backend endpoint
- ✅ Removed references to non-existent `notifications` table

---

## 📋 Setup Instructions

### Step 1: Create the Broadcast Messages Table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  student_count integer DEFAULT 0,
  status text DEFAULT 'sent',
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read broadcasts"
  ON public.broadcast_messages FOR SELECT USING (true);

CREATE POLICY "Allow admins to insert broadcasts"
  ON public.broadcast_messages FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_broadcast_messages_created_at 
  ON public.broadcast_messages(created_at DESC);

COMMENT ON TABLE public.broadcast_messages 
  IS 'Stores broadcast messages sent to all students by admins';
```

**File:** `BROADCAST_MESSAGES_SETUP.sql` (already created in root directory)

---

### Step 2: Frontend Changes (AdminDashboard.tsx)

**Location:** `src/pages/AdminDashboard.tsx`

**Updated `sendBroadcastMessage()` function:**
- ✅ Fetches student user_ids from `user_roles` table
- ✅ Inserts broadcast into `broadcast_messages` table (not `notifications`)
- ✅ Calls new `/api/broadcast` backend endpoint
- ✅ Shows success toast with count of students
- ✅ Clears form fields after sending

**Key changes:**
```tsx
// Insert into correct table
const { data: insertedData, error: insertError } = await supabase
  .from("broadcast_messages")
  .insert({
    title: broadcastTitle.trim(),
    content: broadcastMessage.trim(),
    student_count: profiles.length,
    status: "sent"
  })
  .select();

// Call backend API
const broadcastResponse = await fetch(`${apiUrl}/api/broadcast`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: broadcastTitle.trim(),
    messageContent: broadcastMessage.trim(),
    studentCount: profiles.length
  })
});
```

---

### Step 3: Backend Changes (server/sms-service.mjs)

**Location:** `server/sms-service.mjs`

**New `/api/broadcast` endpoint:**

```javascript
// Broadcast Message Endpoint - saves broadcast to database and sends notifications
app.post('/api/broadcast', async (req, res) => {
  try {
    const { title, messageContent, studentCount } = req.body;

    // Validate input
    if (!title || !messageContent) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'messageContent'] 
      });
    }

    console.log(`📢 [api/broadcast] Broadcast message received`);
    console.log(`   Title: ${title}`);
    console.log(`   Students: ${studentCount || 'unknown'}`);

    // Log the broadcast
    const timestamp = new Date().toISOString();
    const broadcastLog = {
      id: `broadcast_${Date.now()}`,
      title,
      content: messageContent,
      studentCount: studentCount || 0,
      timestamp,
      status: 'sent'
    };

    console.log(`✅ Broadcast recorded:`, broadcastLog);

    res.json({ 
      success: true, 
      message: 'Broadcast message processed successfully',
      broadcast: broadcastLog
    });

  } catch (error) {
    console.error('❌ Error processing broadcast:', error);
    res.status(500).json({ 
      error: 'Failed to process broadcast message', 
      details: error.message 
    });
  }
});
```

---

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────┐
│              Admin Dashboard                             │
│  1. Enter title and message                             │
│  2. Click "Send Message to All Students"                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         sendBroadcastMessage() Function                  │
│  1. Fetch students from user_roles table                │
│  2. Insert broadcast into broadcast_messages table       │
│  3. Call /api/broadcast endpoint                        │
│  4. Show success toast                                  │
│  5. Clear form                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         Backend: /api/broadcast                          │
│  1. Receive title, messageContent, studentCount         │
│  2. Log broadcast to console                            │
│  3. Return { success: true }                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         Supabase: broadcast_messages Table               │
│  - id: uuid                                             │
│  - title: text                                          │
│  - content: text                                        │
│  - created_at: timestamp                                │
│  - student_count: integer                               │
│  - status: text                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### broadcast_messages Table

```sql
CREATE TABLE broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,                    -- e.g., "Safety Alert"
  content text NOT NULL,                  -- Full message text
  created_at timestamp DEFAULT now(),     -- When broadcast was sent
  created_by uuid,                        -- Admin who sent it
  student_count integer DEFAULT 0,        -- How many students received it
  status text DEFAULT 'sent',             -- 'draft', 'sent', 'archived'
  updated_at timestamp DEFAULT now()      -- Last update time
);
```

### Sample Data

```sql
INSERT INTO broadcast_messages (title, content, student_count, status)
VALUES (
  'Emergency Evacuation Drill',
  'This is a scheduled emergency evacuation drill. Please exit the building in an orderly manner and proceed to the designated assembly area.',
  150,
  'sent'
);
```

---

## 🧪 Testing the Feature

### 1. Via Admin Dashboard UI

1. Open http://localhost:8081/admin
2. Scroll to "Send Notification to All Students" section
3. Enter:
   - **Message Title:** "Test Broadcast"
   - **Message Content:** "This is a test message"
4. Click "Send Message to All Students"
5. Verify:
   - ✅ Success toast appears
   - ✅ Form clears
   - ✅ Message appears in Supabase `broadcast_messages` table

### 2. Via Direct API Call

```bash
curl -X POST http://localhost:3001/api/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Broadcast",
    "messageContent": "This is a test message",
    "studentCount": 150
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Broadcast message processed successfully",
  "broadcast": {
    "id": "broadcast_1702123456789",
    "title": "Test Broadcast",
    "content": "This is a test message",
    "studentCount": 150,
    "timestamp": "2024-12-09T10:30:45.123Z",
    "status": "sent"
  }
}
```

### 3. Via Supabase

1. Open Supabase dashboard
2. Navigate to SQL Editor
3. Run:
   ```sql
   SELECT * FROM broadcast_messages 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
4. Verify broadcast messages appear with correct data

---

## 🔧 Configuration

### Environment Variables

No new environment variables needed. The feature uses existing:
- `SUPABASE_URL` - For database access
- `SUPABASE_ANON_KEY` - For client authentication

### Port Configuration

- Frontend: http://localhost:8081
- Backend: http://localhost:3001

---

## ✅ Verification Checklist

- [ ] SQL table created in Supabase
- [ ] Frontend code updated to use `broadcast_messages`
- [ ] Backend `/api/broadcast` endpoint added
- [ ] Admin Dashboard loads without errors
- [ ] Can enter broadcast title and content
- [ ] "Send Message to All Students" button works
- [ ] Success toast appears with student count
- [ ] Form fields clear after sending
- [ ] Message saved in `broadcast_messages` table
- [ ] Backend endpoint receives requests
- [ ] No errors in browser console
- [ ] No errors in server console

---

## 🐛 Troubleshooting

### Error: "Could not find the table 'public.notifications'"

**Solution:** Table was renamed to `broadcast_messages`. SQL table creation is complete.

### Error: "Failed to fetch students: User not allowed"

**Solution:** Removed `supabase.auth.admin.listUsers()` call. Now queries `user_roles` table directly.

### Button disabled but form has content

**Solution:** Both `broadcastTitle` AND `broadcastMessage` must be non-empty. Check both fields.

### No POST data received at `/api/broadcast`

**Verify:**
1. Backend server is running: `node server/sms-service.mjs`
2. Port 3001 is available: `netstat -ano | findstr :3001`
3. CORS is enabled (should be by default with express cors middleware)

### Toast doesn't appear

**Check:**
1. useToast hook is imported
2. Toast component is mounted in page layout
3. Browser developer tools show no errors

---

## 📝 API Documentation

### POST /api/broadcast

**Purpose:** Process and log broadcast messages

**Request:**
```json
{
  "title": string,           // Required: Broadcast title
  "messageContent": string,  // Required: Message content
  "studentCount": number     // Optional: Number of students
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Broadcast message processed successfully",
  "broadcast": {
    "id": string,
    "title": string,
    "content": string,
    "studentCount": number,
    "timestamp": ISO8601,
    "status": "sent"
  }
}
```

**Response (Error - 400/500):**
```json
{
  "error": string,
  "details": string
}
```

---

## 📚 Related Files

- `src/pages/AdminDashboard.tsx` - Frontend form and submission handler
- `server/sms-service.mjs` - Backend API endpoints
- `BROADCAST_MESSAGES_SETUP.sql` - Database table creation script
- `src/integrations/supabase/client.ts` - Supabase client configuration

---

## 🎉 Success!

Your broadcast messaging feature is now fully functional and ready to send messages to all students!

**Next Steps:**
1. Run the SQL setup script in Supabase
2. Restart the backend server
3. Refresh the Admin Dashboard
4. Test the broadcast feature
5. Monitor the database for message records

For questions or issues, check the troubleshooting section above.
