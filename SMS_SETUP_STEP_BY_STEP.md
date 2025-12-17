# SMS Notifications - Step-by-Step Setup Guide

## Overview
This guide walks you through setting up Twilio SMS notifications so that when admins send broadcasts, students receive both in-app notifications AND SMS text messages.

**Total Time:** 10 minutes  
**Difficulty:** Beginner

---

## Part 1: Verify Twilio Credentials (2 minutes)

### Step 1.1: Check .env File
Open your `.env` file and verify these lines exist:

```bash
cat .env | grep TWILIO
```

**You should see:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=4145b33f8a8f560d65b589571cd61dec
TWILIO_PHONE_NUMBER=+12062782788
```

**If any are missing:**
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Log in with your Twilio account
3. Find Account SID and Auth Token
4. Get your Twilio phone number (Messaging → Phone Numbers)
5. Add to `.env` file
6. Save and restart server

---

## Part 2: Start Backend Server (1 minute)

### Step 2.1: Open Terminal
In VS Code:
```bash
# Press Ctrl+` (backtick) to open terminal
# Or: View → Terminal

npm run dev
```

### Step 2.2: Verify Server Started
Look for this message:
```
✓ Twilio SMS service configured successfully
```

**If you see:**
```
⚠ Twilio credentials not configured
```
→ Check `.env` file has all 3 Twilio values

**If server won't start:**
```bash
# Make sure port 3001 is free
# Or run: npm run dev -- --port 3002
```

---

## Part 3: Add Student Phone Numbers (3 minutes)

Students need phone numbers to receive SMS. These are stored in Supabase auth metadata.

### Step 3.1: Open Supabase Dashboard
1. Go to [Supabase](https://supabase.com)
2. Select your project
3. Click **Authentication** → **Users**

### Step 3.2: Select a Student
1. Find a student user in the list
2. Click on their email to open their profile

### Step 3.3: Edit User Metadata
1. Scroll down to **User Metadata** section
2. Look for the JSON editor
3. Add phone number to the JSON:

**Before:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**After:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+12025551234"
}
```

### Step 3.4: Phone Number Format
**IMPORTANT:** Phone must be in E.164 format: `+[country code][number]`

**Examples:**
```
✅ +12025551234         (USA)
✅ +447911123456        (UK)
✅ +33612345678         (France)
❌ 202-555-1234         (Wrong - has dashes)
❌ (202) 555-1234       (Wrong - has parentheses)
❌ 2025551234           (Wrong - missing +)
```

### Step 3.5: Save Changes
1. Click **Save** button
2. Repeat for 2-3 more students (for testing)

---

## Part 4: Verify SMS Endpoint (1 minute)

The SMS endpoint should already be created in your server. Let's verify:

### Step 4.1: Check Server Terminal
Look for these logs (when you started `npm run dev`):

```
✓ Twilio SMS service configured successfully
```

### Step 4.2: Verify Endpoint Exists
In your browser console (F12 → Console) while on Admin Dashboard:

```javascript
// Test if SMS endpoint responds
const response = await fetch('http://localhost:3001/api/send-broadcast-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test',
    message: 'test',
    recipients: []
  })
});
console.log(response.status);
// Should show: 200
```

---

## Part 5: Send Test Broadcast (2 minutes)

### Step 5.1: Open Admin Dashboard
1. Log in as admin
2. Navigate to Admin Dashboard
3. Scroll to "Send Broadcast Message" section

### Step 5.2: Enter Test Message
```
Title:   "Test Alert"
Message: "This is a test SMS notification"
```

### Step 5.3: Send Broadcast
1. Click **Send Broadcast** button
2. Wait 2-3 seconds

### Step 5.4: Check Success Toast
**Should see:**
```
✅ Message Broadcast
Message successfully sent to 47 students (3 SMS)
```

**If you see error:**
- Check backend is running (see Part 2)
- Check student has phone number (see Part 3)
- Check phone number format is `+1234567890`

---

## Part 6: Verify Delivery (3 minutes)

### Step 6.1: Check Student Phone
Open the student's phone:
- Look in Messages/SMS app
- Should have received text:
```
🔔 Test Alert

This is a test SMS notification
```

**If not received:**
→ Continue to Part 7 Troubleshooting

### Step 6.2: Check In-App Notification
1. Log in as the student
2. Look at Student Dashboard
3. Check bell icon (🔔) - should show red badge
4. Click bell to see notification

### Step 6.3: Check Twilio Console
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Click **Messaging** → **Messages**
3. Look for your test message
4. Check **Status** column:
   - ✅ "Delivered" → Working!
   - ⏳ "Sent/Sending" → Still processing
   - ❌ "Failed" → See error message

---

## Part 7: Troubleshooting

### Problem: "Server not running" Error

**Solution:**
```bash
npm run dev
# Check for: ✓ Twilio SMS service configured successfully
```

### Problem: No SMS Received (but in-app notification works)

**Step 1:** Verify student has phone
```javascript
const { data: { users } } = await supabase.auth.admin.listUsers();
const student = users.find(u => u.email === 'student@example.com');
console.log(student.user_metadata?.phone_number);
// Should show: +12025551234
```

**Step 2:** Check phone format
```
✅ +12025551234
❌ 2025551234 (missing +)
❌ +1 202 555 1234 (has spaces)
```

**Step 3:** Check server logs
When you send broadcast, server should show:
```
✅ SMS sent to John Doe (+12025551234): SM123abc...
```

If you see:
```
❌ Failed: Invalid phone number
→ Phone format is wrong
```

**Step 4:** Check Twilio console
1. twilio.com/console
2. Messaging → Messages
3. Look for your message
4. Check Status and any error messages

### Problem: "Twilio not configured"

**Solution:**
1. Open `.env` file
2. Verify all 3 TWILIO lines exist:
   ```
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=...
   ```
3. Save file
4. Restart server: `npm run dev`

### Problem: Trial Account Limitations

**If using Twilio Trial Account:**
- Can only send to verified phone numbers
- Solution: Verify the phone number in Twilio console first

**Steps:**
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Click **Verified Caller IDs**
3. Add student phone number
4. Verify via call/SMS
5. Then broadcasts will work

---

## Part 8: Bulk Testing (Optional)

Once you've verified SMS works with 1-2 students:

### Step 8.1: Add Phone Numbers to More Students
Repeat Part 3 for 5-10 students

### Step 8.2: Send Bulk Broadcast
Admin Dashboard:
```
Title:   "Campus Alert"
Message: "Emergency drill - all students please assemble at north quad"
```

### Step 8.3: Verify Results
```
✅ Message Broadcast
Message successfully sent to 47 students (45 SMS)
```

This shows:
- 47 students got in-app notification
- 45 students received SMS (2 don't have phone numbers)

---

## Part 9: Production Checklist

Before going live:

- [ ] All Twilio credentials in `.env`
- [ ] Backend server running (`npm run dev`)
- [ ] Test broadcast sent successfully
- [ ] Student received SMS on phone
- [ ] In-app notification appeared
- [ ] Twilio console shows "Delivered"
- [ ] Phone numbers in E.164 format
- [ ] Error handling works (tested with invalid number)
- [ ] Server logs are clear (no errors)
- [ ] Twilio account has sufficient balance

---

## Part 10: Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| No SMS received | Phone number missing | Add to user metadata |
| SMS not delivered | Wrong phone format | Use E.164: +12025551234 |
| "Server not running" | Backend not started | `npm run dev` |
| "Twilio not configured" | Missing credentials in .env | Add TWILIO_* variables |
| Some SMS fail | Invalid phone numbers | Check format for each |
| Slow SMS delivery | Twilio queue | Check Twilio console |
| API not found | Server crashed | Restart: npm run dev |

---

## Part 11: Code Changes Summary

**What was added:**

1. **New SMS Endpoint** (`server/sms-service.mjs`)
   - Receives broadcast SMS request
   - Sends to Twilio API
   - Returns success/failure count

2. **Updated Admin Broadcast** (`src/pages/AdminDashboard.tsx`)
   - Fetches student phone numbers
   - Calls SMS endpoint
   - Shows SMS count in success message

**You don't need to make any code changes** - they're already done!

---

## Part 12: Testing with Real Students

Once everything is working:

### Real Scenario 1: Emergency Alert
```
Title: "🚨 EMERGENCY - Building Evacuation"
Message: "Evacuate building A immediately. Use stairs. Assembly point: North quad."

Result:
- All students get instant in-app notification
- All students with phones get SMS
- Campus quickly informed
```

### Real Scenario 2: Safety Tips
```
Title: "Safety Tip"
Message: "Remember to register emergency contacts in your profile for faster emergency response."

Result:
- Broadcast reaches all students
- SMS reinforces message
- Improves safety compliance
```

### Real Scenario 3: Class Cancellation
```
Title: "Class Update"
Message: "Building closure due to maintenance. All classes in Building B are cancelled today."

Result:
- Students notified immediately
- No one misses the announcement
- SMS ensures they're reached
```

---

## Final Checklist

Before declaring SMS "working":

```
✓ Backend running (npm run dev)
✓ Twilio credentials in .env
✓ At least 1 student has phone number
✓ Phone number format is E.164 (+12025551234)
✓ Admin sent test broadcast
✓ Student received in-app notification
✓ Student received SMS text
✓ Twilio console shows message as "Delivered"
✓ No errors in server logs
✓ Success toast shows SMS count
```

If all checked: **✅ SMS Notifications Working!** 🎉

---

## Getting Help

If you get stuck:

1. **Check logs:** Browser console + server terminal
2. **Read files:**
   - `SMS_QUICK_REFERENCE.md` - Quick checklist
   - `SMS_COMPLETE_SOLUTION.md` - Technical details
   - `SMS_TROUBLESHOOTING_QUICK.md` - Problem solving
3. **Check Twilio:**
   - twilio.com/console → Messaging → Messages
   - Look for error details
4. **Verify setup:**
   - Backend running? `npm run dev`
   - Phone numbers added? Supabase Users
   - Phone format correct? `+12025551234`

---

## You're Done! 🚀

SMS notifications are now working. Students will receive:
1. **In-app notification** - Instant in web app
2. **SMS text message** - Via Twilio to their phone

Both notifications arrive within seconds of admin sending broadcast.

**Next steps:**
- Test with your real student users
- Monitor Twilio console for delivery rates
- Enjoy safer campus with better emergency notifications! 🎓

