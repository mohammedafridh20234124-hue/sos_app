# SMS Notifications - Quick Reference Card

## ✅ Fixed: SMS Now Sends When Admin Broadcasts

### What Was Wrong
```
❌ Admin sends broadcast
❌ In-app notification sent ✓
❌ SMS never triggered ✗
```

### What's Fixed Now
```
✅ Admin sends broadcast
✅ In-app notification sent ✓
✅ SMS automatically sent to all students ✓
```

---

## 🚀 Quick Start (5 minutes)

### Step 1: Start Backend
```bash
npm run dev
```
✓ Should show: `✓ Twilio SMS service configured successfully`

### Step 2: Add Student Phone Number
- Supabase Dashboard
- Authentication → Users
- Select a student
- Edit → User Metadata
- Add: `"phone_number": "+12025551234"`
- Save

### Step 3: Send Test Broadcast
- Admin Dashboard
- Title: "Test"
- Message: "Hello SMS"
- Send Broadcast

### Step 4: Verify
- ✅ Browser shows: `"Message Broadcast - sent to X students (X SMS)"`
- ✅ Student phone receives text
- ✅ Server log shows: `✅ SMS sent to X/X students`

---

## 📋 Checklist Before Testing

- [ ] Backend running: `npm run dev`
- [ ] Twilio credentials in `.env`
- [ ] At least 1 student has phone number
- [ ] Phone number format: `+12025551234` (E.164)
- [ ] Supabase notifications table exists

---

## 🔧 What Changed

### New Endpoint
```
POST /api/send-broadcast-sms
```
Sends SMS to list of recipients

### Updated Function
```
AdminDashboard.sendBroadcastMessage()
```
Now calls SMS endpoint after saving notifications

---

## 📱 Student Phone Number Format

**MUST BE:** `+[country code][number]`

| Country | Example |
|---------|---------|
| USA | `+12025551234` |
| UK | `+447911123456` |
| Canada | `+14165551234` |
| France | `+33612345678` |
| Australia | `+61212345678` |

**NOT ACCEPTED:**
- 2025551234 (no +)
- 202-555-1234 (dashes)
- +1 202 555 1234 (spaces)

---

## ❌ If SMS Not Received

### Quick Debug
1. **Is backend running?** → `npm run dev`
2. **Do they have phone number?** → Check Supabase Users
3. **Is phone format correct?** → `+12025551234`?
4. **Is Twilio account active?** → Check account balance

### Check Server Logs
```
✅ SMS sent to John Doe: SM123abc
← Success

❌ Failed to send SMS: Invalid phone number
← Phone format wrong

⚠️ SMS sending skipped: server not running
← Run: npm run dev
```

### Check Twilio Console
1. twilio.com/console
2. Messaging → Messages
3. Look for your message
4. Check Status: Delivered or Failed

---

## 📊 Complete Flow

```
Admin creates broadcast
         ↓
Save to Supabase notifications table
         ↓
Save to localStorage
         ↓
Fetch student phone numbers
         ↓
POST /api/send-broadcast-sms
         ↓
Server sends via Twilio API
         ↓
Students receive SMS text + in-app notification
```

---

## 🎯 Success Looks Like

### Browser Console
```
📱 Attempting to send SMS notifications...
✅ SMS sent to John Doe (+12025551234): SM123abc
✅ SMS sent to Jane Smith (+16175552345): SM456def
📱 SMS sent to 2/2 students
```

### Admin Dashboard Toast
```
✅ Message Broadcast
Message successfully sent to 47 students (45 SMS)
```

### Student Phone
```
SMS Received:
"🔔 Emergency Alert

Campus lockdown in progress. Stay safe."
```

### Twilio Console
```
To: +12025551234
Status: Delivered ✓
Time: Just now
```

---

## 🔑 Key Points

1. **Backend must run** → `npm run dev`
2. **Phone numbers must be E.164** → `+12025551234`
3. **Numbers stored in auth metadata** → Not in database table
4. **Twilio credentials required** → Already in `.env`
5. **Endpoint called automatically** → When admin broadcasts
6. **Works offline** → Falls back to localStorage

---

## 📞 SMS Format Sent to Students

When admin sends:
```
Title: "Emergency Update"
Message: "All students must evacuate building"
```

Student receives SMS:
```
🔔 Emergency Update

All students must evacuate building
```

---

## 🛠️ Files Changed

| File | Change | Lines |
|------|--------|-------|
| `server/sms-service.mjs` | Added SMS endpoint | +67 |
| `src/pages/AdminDashboard.tsx` | Fetch phone, call endpoint | +113 |

---

## ✨ Features

✅ Multiple students at once
✅ Phone number validation
✅ Error handling per student
✅ Demo mode if Twilio not configured
✅ Console logging for debugging
✅ Works even if some students fail
✅ Automatic in-app notification backup
✅ localStorage fallback

---

## ⚡ Commands

**Start backend:**
```bash
npm run dev
```

**Check Twilio logs:**
- Go to twilio.com/console
- Messaging → Messages

**View student phone:**
```javascript
const { data: { users } } = await supabase.auth.admin.listUsers();
users.forEach(u => console.log(u.user_metadata?.phone_number));
```

**Test SMS endpoint:**
```bash
curl -X POST http://localhost:3001/api/send-broadcast-sms \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "message": "Hello",
    "recipients": [
      {
        "user_id": "123",
        "user_name": "John",
        "phone_number": "+12025551234"
      }
    ]
  }'
```

---

## 📖 Full Documentation

For detailed setup and troubleshooting:
- `SMS_COMPLETE_SOLUTION.md` - Full technical guide
- `SMS_TROUBLESHOOTING_QUICK.md` - Problem solving
- `TWILIO_SMS_NOTIFICATIONS_SETUP.md` - Configuration details

---

## 🎓 How It Works (Simple Version)

1. **Admin sends broadcast** → Click "Send" in Admin Dashboard
2. **System saves notifications** → Stored in Supabase + localStorage
3. **System fetches phone numbers** → From student auth metadata
4. **System sends SMS** → Via Twilio API to each phone
5. **Students receive SMS** → Text message on their phone
6. **Students see badge** → Bell icon shows new notification
7. **Complete** → Broadcast delivered via SMS + in-app

---

## 🚨 Emergency SMS Example

**Scenario:** Campus emergency, need to alert all students immediately

**Admin sends:**
```
Title: "🚨 URGENT - Building Evacuation"
Message: "Building A evacuation order. Exit immediately via nearest exit. Assembly point: North quad."
```

**Students receive:**
```
SMS:
🚨 URGENT - Building Evacuation

Building A evacuation order. Exit immediately via nearest exit. Assembly point: North quad.

In-App:
[🔔] Badge on bell icon + full message in notification panel
```

**Timeline:**
- Admin clicks Send: 0s
- SMS sends to all students: 1-3s
- Student receives SMS: 2-5s
- In-app notification visible: Instant

---

## 💡 Tips

- Test with small group first (5 students)
- Verify Twilio balance before bulk broadcast
- Check for SMS delivery logs in Twilio console
- Phone numbers can be added/updated anytime
- SMS works even if student is offline
- In-app notification always appears (SMS optional)
- Errors don't stop broadcasting (continues with next student)

---

## ✅ Verification

```javascript
// In Admin Dashboard console:

// 1. Check students have phones
const { data: { users } } = await supabase.auth.admin.listUsers();
const withPhone = users.filter(u => u.user_metadata?.phone_number);
console.log(`${withPhone.length}/${users.length} students have phone numbers`);

// 2. Check format is correct
withPhone.forEach(u => {
  const p = u.user_metadata.phone_number;
  console.log(`${u.email}: ${p} ${p.startsWith('+') ? '✅' : '❌'}`);
});

// 3. Check Twilio is ready
const response = await fetch('http://localhost:3001/api/send-broadcast-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test',
    message: 'test',
    recipients: [{
      user_id: '123',
      user_name: 'test',
      phone_number: '+12025551234'
    }]
  })
});
const data = await response.json();
console.log('SMS Endpoint:', data);
```

---

## 🎉 You're All Set!

The SMS notification system is fully implemented and ready to use. 

1. **Start backend** → `npm run dev`
2. **Add student phones** → Supabase Users
3. **Send broadcast** → Admin Dashboard
4. **Receive SMS** → Check student phone

That's it! 🚀

