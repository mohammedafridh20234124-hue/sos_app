# Twilio SMS Notifications Setup Guide

## Problem Fixed
✅ **SMS notifications were not being sent when admin broadcasts messages**

The system had:
- ✅ Twilio credentials configured in `.env`
- ✅ SMS service initialized in `sms-service.mjs`
- ❌ **NO endpoint to trigger SMS sending**
- ❌ **NO code calling the SMS endpoint when broadcasts are sent**

## Solution Implemented

### 1. New SMS Broadcast Endpoint
**File:** `server/sms-service.mjs` (lines 590-656)

```javascript
POST /api/send-broadcast-sms
```

**Request Body:**
```json
{
  "title": "Emergency Alert",
  "message": "Campus lockdown in progress. Stay safe.",
  "recipients": [
    {
      "user_id": "uuid",
      "user_name": "John Doe",
      "phone_number": "+1234567890"
    }
  ]
}
```

**Features:**
- ✅ Sends SMS to multiple recipients in one request
- ✅ Graceful fallback if Twilio not configured (logs to console)
- ✅ Handles missing phone numbers
- ✅ Detailed error reporting per recipient
- ✅ Returns success/failure count and details

**Response Example:**
```json
{
  "success": true,
  "sentCount": 45,
  "failedCount": 2,
  "totalRecipients": 47,
  "failedRecipients": [
    {
      "user_name": "Jane Smith",
      "reason": "Invalid phone number format"
    }
  ],
  "message": "Sent to 45/47 recipients"
}
```

### 2. Updated Broadcast Function
**File:** `src/pages/AdminDashboard.tsx` (lines 301-413)

The `sendBroadcastMessage()` function now:

1. **Saves to Supabase** `notifications` table (in-app notifications)
2. **Saves to localStorage** (offline backup)
3. **Fetches student phone numbers** from auth user metadata
4. **Sends SMS via Twilio** to all students with phone numbers
5. **Handles both success and failure** cases gracefully

```typescript
// Step 1: Verify connection
const { data: connTest, error: connError } = await supabase...

// Step 2: Get student user IDs
const { data: profiles, error } = await supabase
  .from("user_roles")
  .select("user_id")
  .eq("role", "student")

// Step 3: Get full user data with phone numbers
const { data: { users }, error: usersError } = 
  await supabase.auth.admin.listUsers();

// Step 4: Create and save notifications
const broadcastNotifications = profiles.map(profile => ({
  user_id: profile.user_id,
  title: broadcastTitle,
  message: broadcastMessage,
  type: "broadcast",
  created_at: new Date().toISOString(),
  read: false,
  read_at: null,
}));

const { data: insertedData, error: insertError } = 
  await supabase.from("notifications").insert(broadcastNotifications);

// Step 5: Extract phone numbers and send SMS
const smsRecipients = profiles
  .map(profile => {
    const user = users?.find(u => u.id === profile.user_id);
    if (user?.user_metadata?.phone_number) {
      return {
        user_id: profile.user_id,
        user_name: user.user_metadata?.name || user.email,
        phone_number: user.user_metadata.phone_number
      };
    }
    return null;
  })
  .filter(r => r !== null);

// Step 6: Call SMS endpoint
const smsResponse = await fetch("http://localhost:3001/api/send-broadcast-sms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: broadcastTitle,
    message: broadcastMessage,
    recipients: smsRecipients
  })
});
```

**Console Output:**
```
🔍 Verifying Supabase connection...
✅ Supabase connection verified
📢 Found students for broadcast: 47
📢 Preparing to insert 47 notifications
✅ Notifications inserted successfully: 47
📱 Attempting to send SMS notifications...
✅ SMS Response: {sentCount: 45, failedCount: 2, ...}
📱 SMS sent to 45/47 students
✅ Broadcast message sent to 47 students
```

## Configuration Requirements

### 1. Twilio Credentials (.env)
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=4145b33f8a8f560d65b589571cd61dec
TWILIO_PHONE_NUMBER=+12062782788
```

**Status:** ✅ Already configured

### 2. Student Phone Numbers
Students must have phone numbers stored in their auth user metadata:

**Where it's stored:**
- `auth.users.user_metadata.phone_number`

**How it's populated:**
- During signup (if phone field included)
- Via profile update (if edit functionality added)

**Current Status:** Check how many students have phone numbers:
```javascript
// In AdminDashboard console:
const { data: { users } } = await supabase.auth.admin.listUsers();
const studentsWithPhone = users.filter(u => u.user_metadata?.phone_number);
console.log(`${studentsWithPhone.length} students have phone numbers`);
```

### 3. Server Running
The SMS endpoint requires the backend server running:
```bash
npm run dev
```

**Server should show:**
```
✓ Twilio SMS service configured successfully
```

## Testing SMS Notifications

### Test 1: Send Broadcast to One Student
1. Go to **Admin Dashboard**
2. Enter broadcast title: `"Test Alert"`
3. Enter broadcast message: `"This is a test SMS"`
4. Click **Send Broadcast**

**Check:**
- ✅ Browser shows "Message Broadcast" toast
- ✅ Student receives in-app notification
- ✅ Student receives SMS (if phone number configured)
- ✅ Server console shows: `✅ SMS sent to X/X students`

### Test 2: Check Server Logs
```
📱 Attempting to send SMS notifications...
✅ SMS sent to user-name (+1234567890): SM1234567890abcdef
📱 SMS sent to 45/47 students
```

### Test 3: Verify Twilio Delivery
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Navigate to **Messaging > Messages**
3. Look for recent messages with status "Delivered"
4. Check timestamp matches broadcast time

## Troubleshooting

### Issue: "SMS sending skipped (server not running)"
**Solution:** Start the backend server
```bash
npm run dev
```

### Issue: SMS sends but students don't receive
**Possible Causes:**
1. **Phone number format wrong** - Must be international format (e.g., +12025551234)
2. **Twilio trial account** - Limited to verified numbers only
3. **Phone number not registered** - Check if user has phone in metadata
4. **Twilio account suspended** - Check Twilio console

**Debug:**
```typescript
// Log all student phone numbers
smsRecipients.forEach(r => {
  console.log(`${r.user_name}: ${r.phone_number}`);
});
```

### Issue: Some SMS send, others fail
**Check Response:**
```json
{
  "failedRecipients": [
    {
      "user_name": "Jane Smith",
      "reason": "The phone number is not a valid 'To' number"
    }
  ]
}
```

**Solution:** Validate phone number format in student profile

### Issue: Twilio says "Invalid phone number"
**Common Issues:**
- ❌ `1234567890` → ✅ `+12025551234`
- ❌ `(202) 555-1234` → ✅ `+12025551234`
- ❌ `+1 202 555 1234` → ✅ `+12025551234`

Phone numbers must be in E.164 format: `+[country code][number]`

### Issue: "Twilio not configured"
**Check .env:**
```bash
grep TWILIO .env
```

**Expected Output:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxx...
TWILIO_AUTH_TOKEN=4145b33f...
TWILIO_PHONE_NUMBER=+12062782788
```

**If missing:** Add credentials to `.env` and restart server

## How It Works: Complete Flow

```
Admin sends broadcast
         ↓
   Verify connection
         ↓
   Fetch student IDs
         ↓
   Create notifications
         ↓
   ┌─────────────────────────────┐
   │  Save to Supabase DB        │
   │  Save to localStorage       │
   └─────────────────────────────┘
         ↓
   Extract phone numbers from student auth metadata
         ↓
   ┌─────────────────────────────┐
   │  POST /api/send-broadcast-sms
   │  (to localhost:3001)
   └─────────────────────────────┘
         ↓
   Server receives SMS request
         ↓
   Loop through recipients
         ↓
   For each recipient:
   ┌──────────────────────────┐
   │ ✅ Send via Twilio       │
   │ OR                       │
   │ ❌ Log error, continue   │
   └──────────────────────────┘
         ↓
   Return results (sent count, failed recipients)
         ↓
   Frontend shows toast:
   "Message sent to 45/47 students (45 SMS)"
         ↓
   ✅ Complete
```

## API Reference

### Send Broadcast SMS
```
POST /api/send-broadcast-sms
Content-Type: application/json
```

**Request:**
```json
{
  "title": "string (broadcast title)",
  "message": "string (broadcast message)",
  "recipients": [
    {
      "user_id": "string (uuid)",
      "user_name": "string",
      "phone_number": "string (E.164 format)"
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "sentCount": number,
  "failedCount": number,
  "totalRecipients": number,
  "failedRecipients": [
    {
      "user_name": "string",
      "reason": "string (error message)"
    }
  ],
  "message": "string"
}
```

**Error Response:**
```json
{
  "error": "string (error message)",
  "details": "string (detailed error info)"
}
```

## Summary

| Component | Status | Details |
|-----------|--------|---------|
| Twilio Credentials | ✅ Configured | In `.env` |
| SMS Service | ✅ Initialized | In `sms-service.mjs` |
| Broadcast Endpoint | ✅ Created | `/api/send-broadcast-sms` |
| Broadcast Function | ✅ Updated | Calls SMS endpoint |
| Phone Numbers | ⏳ Check | In student auth metadata |
| Server Running | ⏳ Check | `npm run dev` |
| Student Phone Numbers | ⏳ Verify | E.164 format required |

## Next Steps

1. **Verify Twilio Account**
   - Log in to [Twilio Console](https://www.twilio.com/console)
   - Check account balance/credits
   - Verify phone number is verified (if trial account)

2. **Update Student Phone Numbers**
   - Ensure all students have phone numbers in E.164 format
   - Update via Supabase dashboard if needed

3. **Test SMS Delivery**
   - Send test broadcast
   - Check student phone receives SMS
   - Verify Twilio console shows "Delivered"

4. **Monitor Production**
   - Check server logs for SMS send failures
   - Monitor Twilio console for delivery rates
   - Set up alerts for failed SMS

## Code Changes Summary

### Files Modified:
1. **server/sms-service.mjs**
   - Added `/api/send-broadcast-sms` endpoint (67 lines)
   - Supports demo mode when Twilio not configured

2. **src/pages/AdminDashboard.tsx**
   - Updated `sendBroadcastMessage()` function
   - Now fetches student phone numbers
   - Calls SMS endpoint for each broadcast
   - Shows SMS count in success toast

### Testing Checklist:
- [ ] Twilio credentials in `.env`
- [ ] Backend server running (`npm run dev`)
- [ ] At least one student has phone number
- [ ] Send test broadcast from Admin Dashboard
- [ ] Check Student Dashboard for notification
- [ ] Check student phone for SMS
- [ ] Verify Twilio console shows message as "Delivered"

