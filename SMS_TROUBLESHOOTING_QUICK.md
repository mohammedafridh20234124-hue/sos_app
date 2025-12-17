# Quick SMS Troubleshooting Checklist

## ✅ Requirements to Receive Twilio SMS

### 1. Backend Server Must Be Running
```bash
npm run dev
```

**Verify:** Check console shows:
```
✓ Twilio SMS service configured successfully
```

**If you see:**
```
⚠ Twilio credentials not configured
```
→ Check `.env` file has TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

---

### 2. Student Must Have Phone Number
Student's phone number must be stored in their auth profile:

**Format Required:** `+12025551234` (E.164 international format)

**NOT Accepted:**
- ❌ `2025551234`
- ❌ `(202) 555-1234`
- ❌ `202-555-1234`
- ❌ `+1 202 555 1234`

**To Check Student Phone Numbers:**
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click on a student
3. Scroll to **User Metadata**
4. Look for `phone_number` field
5. Verify it's in format: `+[country code][number]`

**To Add/Update Phone Number:**
1. In Supabase Users list
2. Click student → Edit
3. Update User Metadata (JSON):
```json
{
  "name": "John Doe",
  "phone_number": "+12025551234"
}
```
4. Click Save

---

### 3. Twilio Credentials Must Be Valid
Check `.env` file:
```bash
cat .env | grep TWILIO
```

**Output Should Show:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

**If any are blank:**
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Get Account SID and Auth Token
3. Get your Twilio phone number
4. Add to `.env`
5. Restart server: `npm run dev`

---

### 4. Twilio Trial Account Limitations (if applicable)

**If using Twilio Trial Account:**
- ❌ Can ONLY send to verified phone numbers
- ✅ Can use any number to receive

**Solution:**
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Navigate to **Verified Caller IDs**
3. Add student phone numbers there
4. Verify via phone call/SMS
5. Then messages will be delivered

**Or:** Upgrade Twilio account to full (not trial)

---

## 🧪 Test SMS Delivery

### Test 1: Admin Send Broadcast
1. Open **Admin Dashboard**
2. Enter title: `"Test SMS"`
3. Enter message: `"Hello from SOS Campus"`
4. Click **Send Broadcast**
5. Check browser console for: `✅ SMS sent to X/X students`

### Test 2: Check Server Logs
Open terminal where server is running (`npm run dev`)

**Look for:**
```
📱 Attempting to send SMS notifications...
✅ SMS sent to John Doe (+12025551234): SM1234abc...
📱 SMS sent to 1/1 students
```

### Test 3: Check Student Phone
Did student receive SMS text message?
- ✅ YES → SMS delivery working!
- ❌ NO → Continue troubleshooting below

### Test 4: Verify Twilio Delivery
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Click **Messaging** → **Messages**
3. Look for your test message
4. Check **Status** column:
   - ✅ "Delivered" → Working
   - ⏳ "Queued/Sending" → Still processing
   - ❌ "Failed/Undelivered" → See error reason

---

## ❌ SMS Not Received? Debug Steps

### Step 1: Check Student Has Phone Number
```javascript
// In Admin Dashboard console:
const { data: { users } } = await supabase.auth.admin.listUsers();
users.forEach(u => {
  console.log(`${u.email}: ${u.user_metadata?.phone_number || 'NO PHONE'}`);
});
```

**Expected:**
```
student1@example.com: +12025551234
student2@example.com: +12025557890
```

**If you see "NO PHONE":**
→ Add phone numbers to student metadata

---

### Step 2: Check Server Logs
```
✅ SMS sent to John Doe (+12025551234): SM123abc...
```

**If you see:**
```
❌ Failed to send SMS: The phone number is not a valid 'To' number
```
→ Phone number format is wrong (not E.164)

**If you see:**
```
⚠️ SMS sending skipped (server not running)
```
→ Backend server is not running. Run `npm run dev`

**If you see:**
```
❌ Failed to send SMS: Invalid API key
```
→ Twilio credentials are wrong. Check `.env` TWILIO_AUTH_TOKEN

---

### Step 3: Check Twilio Console
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Click **Messaging** → **Messages**
3. Look for your recent messages
4. Check the **Status** and **Error Messages**

**Common Twilio Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid phone number" | Wrong format | Use E.164: +12025551234 |
| "Unreachable destination" | Number blocked/invalid | Verify number is real |
| "Unsubscribed" | Number opted out of SMS | Add to Twilio unsubscribe list |
| "Daily limit exceeded" | Too many SMS sent | Check Twilio account limits |
| "Account suspended" | Payment/policy issue | Check Twilio account status |

---

### Step 4: Verify Phone Number Format
Test in JavaScript console:

```javascript
// Valid E.164 format
const validNumbers = [
  "+12025551234",      // ✅ US
  "+447911123456",     // ✅ UK
  "+33612345678",      // ✅ France
];

// Invalid format
const invalidNumbers = [
  "2025551234",        // ❌ Missing +
  "+1 202 555 1234",   // ❌ Has spaces
  "(202) 555-1234",    // ❌ Wrong format
];
```

---

### Step 5: Check Student Received Notification
Even if SMS fails, student should get in-app notification:

1. Go to **Student Dashboard**
2. Look for **bell icon** (🔔) with red badge
3. Click bell to see notifications
4. Should show broadcast message

**If notification missing:**
→ Notifications table not created. See `CREATE_NOTIFICATIONS_TABLE.sql`

---

## 📊 Complete SMS Flow

```
Admin sends broadcast
    ↓
Server verifies Supabase connection
    ↓
Fetch all students
    ↓
Fetch student phone numbers
    ↓
Create notifications in DB
    ↓
┌─────────────────────────────┐
│ For each student:           │
│  Send SMS via Twilio API    │
│  Log success/failure        │
└─────────────────────────────┘
    ↓
Return results to admin
    ↓
Admin sees toast: "Sent to X/47 students (45 SMS)"
    ↓
Students receive:
├─ In-app notification (always)
└─ SMS text message (if has phone number)
```

---

## 🆘 Still Not Working?

### Check This Sequence:

1. **Is backend running?**
   ```bash
   npm run dev
   ```
   Should see: `✓ Twilio SMS service configured successfully`

2. **Do students have phone numbers?**
   - Check Supabase Users → User Metadata
   - Phone numbers in E.164 format? (+12025551234)

3. **Is it a trial account?**
   - Verified the phone number in Twilio?
   - Or upgrade to full account?

4. **Are Twilio credentials correct?**
   ```bash
   cat .env | grep TWILIO_
   ```

5. **Does broadcast send notifications?**
   - Student sees bell icon badge?
   - Student sees in-app notification?
   - If not → create notifications table first

6. **Check Twilio console**
   - Any messages shown?
   - What status? (Delivered/Failed)
   - What error message?

---

## 📞 Example SMS Test

### Setup:
- Admin: John (admin@example.com)
- Student: Jane (jane@example.com)
- Jane's phone: +16175551234

### Execute:
1. Jane logs into Student Dashboard
2. Adds phone: +16175551234 to her profile
3. John opens Admin Dashboard
4. Sends broadcast: "Hello Jane!"
5. Check Jane's phone for SMS text

### Expected Results:
- ✅ Jane sees notification badge on bell icon
- ✅ Jane sees message in notification panel
- ✅ Jane's phone receives SMS text: "🔔 [title]... [message]..."
- ✅ Twilio console shows message as "Delivered"

---

## 📋 Verification Checklist

Before declaring SMS "working":

- [ ] Backend server running (`npm run dev`)
- [ ] Twilio credentials in `.env`
- [ ] At least 1 student has phone number in E.164 format
- [ ] notifications table exists in Supabase
- [ ] Admin sends test broadcast
- [ ] Student receives in-app notification
- [ ] Student receives SMS text message
- [ ] Twilio console shows message status "Delivered"

If all checked → ✅ SMS delivery is working!

---

## 📱 Common Phone Formats by Country

```
USA:        +12025551234       (1 + area code + number)
UK:         +447911123456      (44 + number)
Canada:     +14165551234       (1 + area code + number)
France:     +33612345678       (33 + number without leading 0)
Germany:    +491234567890      (49 + number without leading 0)
Japan:      +81312345678       (81 + number without leading 0)
Australia:  +61212345678       (61 + number without leading 0)
```

**Rule:** Always: `+ [country code] [area code] [number]` (no spaces/dashes)

