# Application Setup & Execution Guide

## ✅ All Errors Fixed!

The build is **successful** with no compilation errors. The application is ready to run.

### Fixed Issues:
1. ✅ **email-service.mjs** - Removed TypeScript type annotations (`.mjs` files use JavaScript, not TypeScript)
2. ✅ **StudentDashboard.tsx** - Fixed Promise.catch() type error by using proper async/await pattern

---

## 📋 Prerequisites

Before running the application, ensure you have:

```bash
node --version        # Should be v16+ (ideally v18+)
npm --version         # Should be v8+
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd "d:\Afridh Studies\SOS APP\prompty-web-builder-main\prompty-web-builder-main"
npm install
```

### Step 2: Configure Environment Variables

Create `.env.local` in the project root with:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here

# Email OTP Service (Optional but recommended for testing)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-16-chars

# SMS OTP Service (Optional - requires Twilio account)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**How to get Supabase credentials:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy Project URL and Publishable Key from Settings → API

**How to get Gmail app password:**
1. Enable 2-Factor Authentication on Google Account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate 16-character app password
4. Paste into `.env.local`

### Step 3: Run the Application

**Open TWO terminals:**

**Terminal 1 - Frontend (port 8080):**
```bash
cd "d:\Afridh Studies\SOS APP\prompty-web-builder-main\prompty-web-builder-main"
npm run dev
```

Expected output:
```
  ➜  Local:   http://localhost:8080/
  ➜  press h to show help
```

**Terminal 2 - Backend (port 3001):**
```bash
cd "d:\Afridh Studies\SOS APP\prompty-web-builder-main\prompty-web-builder-main"
npm run server
```

Expected output:
```
Server running on http://localhost:3001
Email service: Configured
```

---

## 🌐 Access the Application

Once both servers are running:

- **Student Portal**: http://localhost:8080/auth?role=student
- **Admin Portal**: http://localhost:8080/auth?role=admin
- **Home Page**: http://localhost:8080/

---

## 🧪 Testing the Application

### Test Student Registration:
1. Go to http://localhost:8080/auth?role=student
2. Click "Sign Up"
3. Enter email, register number, phone (optional)
4. Check inbox for OTP email
5. Enter OTP and complete registration

### Test Admin Login:
1. Go to http://localhost:8080/auth?role=admin
2. Use any email/password combination (Supabase handles auth)

### Test OTP Email:
- If configured correctly, OTP should arrive in seconds
- Check spam folder if not in inbox
- OTP expires in 10 minutes

---

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8080 (Frontend)
Get-Process | Where-Object {$_.Port -eq 8080} | Stop-Process -Force

# Kill process on port 3001 (Backend)
Get-Process | Where-Object {$_.Port -eq 3001} | Stop-Process -Force
```

### CORS Errors
- Ensure backend is running on port 3001
- Check browser console (F12) for detailed error
- Verify `VITE_SUPABASE_URL` is correct

### OTP Not Sending
- Verify email credentials in `.env.local`
- Check backend terminal for error logs
- Gmail users: Must use App Password, not regular password
- Test with: `curl -X POST http://localhost:3001/api/health`

### Database Connection Failed
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Check Supabase project is not paused
- Try restarting both servers

---

## 📦 Build for Production

```bash
npm run build
```

Output created in `dist/` folder. Ready to deploy!

---

## 🔧 Available Scripts

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run server       # Start backend server (port 3001)
npm run lint         # Check code quality (ESLint)
```

---

## ✨ Key Features Enabled

- ✅ Email/Password Authentication
- ✅ OTP Verification (Email)
- ✅ SMS OTP (if Twilio configured)
- ✅ Real-time Notifications
- ✅ Location Tracking
- ✅ Photo/Audio Recording
- ✅ Admin Dashboard
- ✅ Student Dashboard

---

## 📞 Support

For detailed setup instructions, see:
- `AUTHENTICATION_SETUP.md` - Complete auth configuration
- `QUICK_START.md` - Quick reference guide
- `.github/copilot-instructions.md` - Architecture overview

---

**Last Updated:** December 7, 2025
**Build Status:** ✅ Success
**Ready to Run:** Yes
