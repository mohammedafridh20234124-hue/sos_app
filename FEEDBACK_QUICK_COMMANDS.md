# 📋 Feedback SMS System - Quick Reference

## 🚀 Quick Start

### Option 1: Automated Script (Easiest)
```powershell
.\start-feedback-system.ps1
```

### Option 2: Manual Start
```powershell
# Terminal 1 - Backend
Start-Job -ScriptBlock { node server/sms-service.mjs } -Name "backend"

# Terminal 2 - Frontend  
Start-Job -ScriptBlock { npm run dev } -Name "frontend"

# Wait 5 seconds for startup...
Start-Sleep -Seconds 5
```

---

## 🔍 Common Commands

### View Logs
```powershell
# Backend logs
Get-Job -Name "backend" | Receive-Job

# Frontend logs
Get-Job -Name "frontend" | Receive-Job -Keep

# Live monitoring
Get-Job -Name "backend" | Receive-Job -Keep -Wait
```

### Test Endpoints
```powershell
# Health check
(Invoke-WebRequest http://localhost:3001/api/health -UseBasicParsing).Content

# Send test feedback
$body = @{studentId="test"; studentName="TestUser"; feedbackMessage="Test"} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3001/api/feedback -Method Post -ContentType application/json -Body $body -UseBasicParsing
```

### Check Port Availability
```powershell
netstat -ano | findstr "3001|8080"
# Should see:
# TCP 0.0.0.0:3001 LISTENING
# TCP 0.0.0.0:8080 LISTENING
```

### Stop All Services
```powershell
Get-Job | Stop-Job -PassThru | Remove-Job
```

---

## 🎯 Testing Workflow

### 1. Start Systems
```powershell
.\start-feedback-system.ps1
```

### 2. Open App
Visit: http://localhost:8080

### 3. Submit Feedback
- Click "Questions & FAQs" in student dashboard
- Type feedback message
- Click "Send Feedback"
- **Should receive SMS within 5-10 seconds**

### 4. Check Backend Confirmation
```powershell
Get-Job -Name "backend" | Receive-Job | Select-String "Feedback SMS sent"
```

### 5. Verify Database
Check Supabase console for feedback in `student_messages` table

---

## 🐛 Troubleshooting

### Problem: "Backend not responding"
**Solution:**
```powershell
# Verify it's running
netstat -ano | findstr "3001"

# Check logs for errors
Get-Job -Name "backend" | Receive-Job

# Restart if needed
Get-Job -Name "backend" | Stop-Job | Remove-Job
Start-Job -ScriptBlock { node server/sms-service.mjs } -Name "backend"
```

### Problem: Port already in use
**Solution:**
```powershell
# Find process using port
netstat -ano | findstr ":3001"
# Result: TCP 0.0.0.0:3001 LISTENING 12345

# Kill the process
Stop-Process -Id 12345 -Force
```

### Problem: "Unable to connect to remote server"
**Solution:**
- Make sure backend is started with **PowerShell Job** method (not cmd)
- Check: `netstat -ano | findstr "3001"` should show LISTENING
- Wait longer (5 seconds) after starting

### Problem: "Feedback Saved Locally" in UI
**This is a fallback mechanism - means API unreachable:**
```powershell
# 1. Check if backend is running
Get-Job

# 2. Check if it's listening on port 3001
netstat -ano | findstr "3001"

# 3. Check for errors
Get-Job -Name "backend" | Receive-Job | tail -20

# 4. Restart backend
Get-Job -Name "backend" | Stop-Job | Remove-Job
Start-Job -ScriptBlock { node server/sms-service.mjs } -Name "backend"
Start-Sleep -Seconds 3

# 5. Try again
```

---

## 📊 System Architecture

```
Frontend (http://localhost:8080)
    ↓
[Vite Proxy] /api → localhost:3001
    ↓
Backend API Server (http://localhost:3001)
    ↓
[Express Routes]
    ↓
┌─────────────────┬──────────────┐
│                 │              │
v                 v              v
Supabase DB    Twilio SMS    Logging
```

---

## 📱 Current Configuration

| Component | Value | Status |
|-----------|-------|--------|
| **Frontend Port** | 8080 | ✅ |
| **Backend Port** | 3001 | ✅ |
| **Twilio Account** | AC69b9ca... | ✅ |
| **Admin Phone** | +918531996611 | ✅ Verified |
| **Twilio Number** | +19859996847 | ✅ |
| **Database** | Supabase | ✅ |

---

## 🔐 Credentials

All credentials are in `.env`:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ADMIN_PHONE_NUMBER`
- `VITE_ADMIN_SERVER_URL` (backend URL for frontend)

⚠️ **Never commit `.env` to version control!**

---

## 🎓 Key Files

| File | Purpose |
|------|---------|
| `server/sms-service.mjs` | Backend API server |
| `src/components/FeedbackModal.tsx` | Frontend feedback form |
| `vite.config.ts` | Proxy configuration |
| `.env` | Environment variables |
| `start-feedback-system.ps1` | Auto-startup script |

---

## 📞 SMS Details

### When Feedback is Submitted:
1. ✅ Message saved to Supabase `student_messages` table
2. ✅ API call made to `POST /api/feedback`
3. ✅ Backend calls `sendFeedbackNotification()`
4. ✅ Twilio SMS sent to `+918531996611`
5. ✅ Message SID logged to backend console
6. ✅ Toast notification shown to student
7. ✅ SMS arrives on admin phone (5-10 seconds)

### Example Backend Output:
```
✅ [api/feedback] Feedback received from student: John Doe (student-123)
   Message: I need help with math homework
✅ Feedback SMS sent to admin (+918531996611)
   Message SID: SM52f8a17...
```

---

## 🆘 Emergency Commands

```powershell
# Complete system restart
Get-Job | Stop-Job -PassThru | Remove-Job -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue 2>&1 | Out-Null
Start-Sleep -Seconds 2
.\start-feedback-system.ps1
```

---

**Last Updated:** 2025-12-08  
**Version:** 1.0  
**Status:** ✅ Production Ready
