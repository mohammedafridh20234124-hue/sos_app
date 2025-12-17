# Notifications System Setup Guide

## Problem
The broadcast/notifications feature is not working because the `notifications` table doesn't exist in the Supabase database.

## Solution
You need to create the notifications table in your Supabase project using the SQL Editor.

### Step-by-Step Setup

#### 1. Open Supabase SQL Editor
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project: `lkxprmsqmtwfouyvoyqx`
- Click on **SQL Editor** (left sidebar)
- Click **New Query**

#### 2. Copy and Run the Setup SQL
- Open the file: `SETUP_NOTIFICATIONS_TABLE.sql` in the root directory
- Copy all the SQL code
- Paste it into the Supabase SQL Editor
- Click **Run** button

#### 3. Verify the Table Was Created
- Go to **Table Editor** in Supabase
- You should see a new table called `notifications`
- It should have these columns:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key to auth.users)
  - `alert_id` (UUID, Optional)
  - `title` (VARCHAR)
  - `message` (TEXT)
  - `type` (VARCHAR) - contains values like 'alert', 'broadcast', 'info', etc.
  - `created_at` (TIMESTAMP)
  - `read` (BOOLEAN)
  - `read_at` (TIMESTAMP, Optional)
  - `created_by_admin` (BOOLEAN)

#### 4. Enable Real-time Subscriptions (Optional but Recommended)
In Supabase SQL Editor, run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

Or use the UI:
- Go to **Database** → **Replication**
- Find `notifications` table
- Toggle the **Replication** switch ON

### Testing the System

#### Test 1: Send a Broadcast from Admin Dashboard
1. Go to Admin Dashboard
2. Scroll to "Send Notification to All Students" section
3. Enter:
   - **Title**: "Test Message"
   - **Content**: "This is a test broadcast"
4. Click **Send Message to All Students**
5. You should see a success message: "✅ Message Broadcast - Message sent to X students"

#### Test 2: Receive on Student Dashboard
1. Open Student Dashboard (or another browser/tab)
2. You should see a toast notification appear: "📢 Test Message"
3. Click the **Bell icon** in the header to open the notification panel
4. The message should appear in the notification drawer with:
   - Title
   - Message preview
   - "Admin" badge
   - Time sent
   - Delete option

#### Test 3: Check Browser Console
- Open Developer Tools (F12)
- Go to **Console** tab
- Look for these log messages:
  - ✅ "Fetched broadcasts from DB: X"
  - ✅ "New broadcast received via subscription: ..."
  - ✅ "Subscription status: SUBSCRIBED"

If you see errors instead, take note of them and share with support.

### Troubleshooting

**Error: "Could not find the table 'public.notifications' in the schema cache"**
- The table doesn't exist yet
- Follow the setup steps above

**Error: "Failed to send broadcast message"**
- Check browser console for detailed error
- Verify Supabase credentials in `.env` file
- Ensure notifications table exists

**Messages not appearing in real-time**
- Enable real-time subscriptions (step 4 above)
- Refresh the page to see if messages appear
- Check if RLS policies are blocking access (unlikely with our setup)

**Messages appear in Admin Dashboard but not Student Dashboard**
- Check that Student Dashboard is fetching from the correct user_id
- Verify in browser console that user_id matches between admin and student
- Check localStorage: `broadcast_notifications_[user_id]`

### File Structure
```
prompty-web-builder-main/
├── SETUP_NOTIFICATIONS_TABLE.sql          ← Run this in Supabase SQL Editor
├── supabase/
│   └── migrations/
│       └── 20251208_fix_notifications_schema.sql  ← Backup copy
├── src/
│   ├── pages/
│   │   ├── AdminDashboard.tsx              ← Sends broadcasts
│   │   └── StudentDashboard.tsx            ← Receives broadcasts
│   └── components/
│       └── StudentNotificationPanel.tsx    ← Displays notifications
└── test-broadcast.mjs                      ← Test script
```

### Quick Reference: Column Purposes

| Column | Purpose | Example |
|--------|---------|---------|
| `id` | Unique identifier | `123e4567-e89b-12d3-a456-426614174000` |
| `user_id` | Student receiving the notification | `[student-uuid]` |
| `alert_id` | Emergency alert if related | `[alert-uuid]` or NULL |
| `title` | Broadcast title | "Safety Drill" |
| `message` | Full message text | "This is a test safety message" |
| `type` | Category of message | "broadcast", "alert", "info", "warning" |
| `created_at` | When message was sent | `2025-12-08 10:30:00` |
| `read` | Whether student has read it | `false` or `true` |
| `read_at` | When student marked as read | NULL or timestamp |
| `created_by_admin` | Was this sent by admin? | `true` |

### API Endpoints Being Used

**Admin Dashboard** (Sends broadcasts):
```typescript
// Insert notifications for all students
await supabase
  .from("notifications")
  .insert(broadcastNotifications)
  .select();
```

**Student Dashboard** (Receives broadcasts):
```typescript
// Fetch existing broadcasts
await supabase
  .from('notifications')
  .select('id, title, message, created_at')
  .eq('type', 'broadcast')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// Subscribe to new broadcasts
supabase.channel(`broadcasts:${user.id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'notifications',
    filter: `type=eq.broadcast AND user_id=eq.${user.id}`
  }, handleNewBroadcast)
  .subscribe();
```

### Support

If you encounter any issues:
1. Check the error message in the toast notification
2. Open browser console (F12) and look for error logs
3. Verify the notifications table exists in Supabase
4. Ensure all environment variables are set correctly in `.env`
5. Try running: `npm run dev` to restart the development server

---

**Last Updated**: December 8, 2025
**Version**: 1.0
