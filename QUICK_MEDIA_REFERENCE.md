# 🚨 QUICK REFERENCE - Media Sharing System

## ⚡ START HERE

### **What to Do Right Now:**

```bash
# Terminal 1: Start Backend
npm run server

# Terminal 2: Start Frontend  
npm run dev
```

### **Then Test:**
1. Open: http://localhost:8080/auth?role=student
2. Sign in
3. Click "Start SOS" 
4. Check backend terminal for `✅ Stored photo` message
5. Open admin dashboard: http://localhost:8080/auth?role=admin
6. Should see photos and audio

---

## 🔴 IF MEDIA NOT SHOWING

### **Check #1: Is Backend Running?**
```bash
curl http://localhost:3001/api/health
```
Should return `{"status":"ok"}`

### **Check #2: Backend Terminal Output**
Should show:
```
📹 [api/receive] POST request received
✅ Received live recording from user: [Name]
```

### **Check #3: Browser Console (F12)**
Should show:
```
✅ Send successful
```

### **Check #4: Storage Exists?**
File should exist: `server/uploads/recordings-metadata.json`

---

## 🔧 WHAT WAS CHANGED

| File | What Changed | Why |
|------|-------------|-----|
| `server/sms-service.mjs` | Enhanced `/api/receive` logging & validation | Debug difficult issues |
| `src/components/ui/live-recorder.tsx` | Better error handling | Show actual problems |
| Both | Added timestamps and buffer validation | Make it reliable |

---

## 📊 EXPECTED BEHAVIOR

### **Student Side:**
- ✅ Sees "Recording ●" indicators
- ✅ Sees location "Tracking ✓"
- ✅ Sees "Send in: 7s" countdown
- ✅ Sees "Status: ✓ Video + Audio Sent"

### **Backend:**
- ✅ Logs every file received
- ✅ Saves to `server/uploads/`
- ✅ Returns HTTP 200 with `success: true`

### **Admin Side:**
- ✅ Sees student name in list
- ✅ Sees photo thumbnails
- ✅ Can play audio
- ✅ Sees location coordinates

---

## ❌ ERRORS & FIXES

| Error | Fix |
|-------|-----|
| "Cannot reach server" | Start backend: `npm run server` |
| "No files received" | Check browser console for JS errors |
| "Photos empty" | Check `server/uploads/` directory exists |
| "Audio won't play" | Check browser console for CORS errors |

---

## 📁 KEY FILES

```
Frontend Capture:  src/components/ui/live-recorder.tsx
Backend Storage:   server/sms-service.mjs  
Admin Viewing:     src/pages/AdminDashboard.tsx
Data on Disk:      server/uploads/recordings-metadata.json
```

---

## 🎯 SUCCESS INDICATORS

All of these should be true:

- [ ] Backend shows "POST /api/receive" logs
- [ ] Student sees "Send in: Xs" countdown
- [ ] Backend shows "✅ Stored photo:" message
- [ ] Files exist in `server/uploads/`
- [ ] Admin can see student in list
- [ ] Admin can view photos/audio
- [ ] Media persists after page refresh

---

## 💾 PERMANENT FIX APPLIED

✅ **Backend**: `/api/receive` now has:
- Detailed file-by-file logging
- Buffer size validation
- Disk persistence error handling
- Full error stack traces

✅ **Frontend**: Error handling now:
- Shows errors in UI (not just console)
- Doesn't block recording on network errors
- Logs server URL and timestamps
- Handles timeouts gracefully

---

## 🚀 ARCHITECTURE

```
Student Device
    ↓
[Start SOS] → Capture Video + Audio
    ↓
[FormData] → Add User ID, Alert ID, Location Headers
    ↓
[POST] → http://localhost:3001/api/receive
    ↓
Backend Server
    ↓
[Receive] → Extract files from FormData
    ↓
[Validate] → Check buffers exist and have data
    ↓
[Store] → In memory: recordingsByUser[userId]
    ↓
[Save] → To disk: server/uploads/
    ↓
[Respond] → HTTP 200 { success: true }
    ↓
Admin Dashboard
    ↓
[Load] → GET /api/recordings?userId=STUDENT_ID
    ↓
[Display] → Show photos and audio clips
    ↓
[Retrieve] → GET /api/photo/:id or /api/audio/:id
    ↓
[Play] → Browser displays image/audio
```

---

## 📞 SUPPORT DOCS

- **Full Details**: `MEDIA_SHARING_SOLUTION.md`
- **Troubleshooting**: `MEDIA_SHARING_PERMANENT_FIX.md`
- **Architecture**: `.github/copilot-instructions.md`

---

**Status**: ✅ READY TO USE
**Last Updated**: December 7, 2025
