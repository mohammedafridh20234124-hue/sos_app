# Campus Security Emergency Response System - Setup & Configuration Guide

## Overview

This guide covers the complete setup for the new authentication system including Google OAuth, OTP verification, enhanced registration, and real-time notifications.

## Table of Contents

1. [Database Setup](#database-setup)
2. [Google OAuth Configuration](#google-oauth-configuration)
3. [Email Service Setup](#email-service-setup)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Feature Overview](#feature-overview)
7. [Testing](#testing)

---

## Database Setup

### Migration Files

The database migration file has been created at:
```
supabase/migrations/20251215_add_otp_and_notifications.sql
```

This migration creates:

1. **OTP Tokens Table** - Stores one-time passwords for email verification
   - `id` - UUID primary key
   - `email` - User email
   - `otp_code` - 6-digit OTP
   - `created_at` - Timestamp of creation
   - `expires_at` - Timestamp of expiration (10 minutes)
   - `verified` - Boolean status
   - `attempt_count` - Number of verification attempts

2. **Notifications Table** - Real-time alerts for users
   - `id` - UUID primary key
   - `user_id` - Reference to auth user
   - `alert_id` - Reference to emergency alert
   - `title` - Notification title
   - `message` - Notification message
   - `type` - alert, info, or warning
   - `created_at` - Timestamp
   - `read` - Boolean read status

3. **Updated Profiles Table**
   - `register_number` - Student/register number
   - `phone` - Phone number (optional)

### Apply Migration

To apply the migration:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Run SQL directly in Supabase Studio
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Click "New Query"
# 3. Copy and paste the SQL from the migration file
# 4. Click "Run"
```

---

## Google OAuth Configuration

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the following APIs:
   - Google+ API
   - OAuth 2.0
4. Go to "Credentials" and click "Create Credentials"
5. Select "OAuth 2.0 Client ID"
6. Choose "Web application"
7. Add authorized redirect URIs:
   ```
   http://localhost:8080
   http://localhost:8080/auth
   https://your-deployed-domain.com
   https://your-deployed-domain.com/auth
   ```
8. Copy the Client ID and Secret

### Step 2: Configure in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Google"
3. Enter your Google Client ID and Secret
4. Add Redirect URL: `https://your-project.supabase.co/auth/v1/callback?provider=google`

### Step 3: Update Environment Variables

Add to your `.env.local` file:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## Email Service Setup

### Using Gmail

Gmail is the recommended SMTP provider due to ease of setup.

#### Prerequisites:
- Gmail account
- 2-factor authentication enabled
- App-specific password created

#### Steps:

1. **Enable 2-Factor Authentication**
   - Go to myaccount.google.com
   - Security section
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Generate password (will be 16 characters)
   - Copy this password

3. **Configure Environment Variables**
   ```bash
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

### Using Other Email Providers

#### Outlook/Office365:
```bash
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Custom SMTP (SendGrid, AWS SES, etc.):
```bash
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
```

---

## Environment Variables

### Complete `.env.local` File

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

### File Location
- Frontend env: `.env.local` (root directory, gitignored)
- Backend env: `.env` (root directory, gitignored)

---

## Running the Application

### Start Development Servers

#### Terminal 1 - Frontend (Vite)
```bash
cd d:\Afridh\ Studies\SOS\ APP\prompty-web-builder-main\prompty-web-builder-main
npm run dev
# Server runs on http://localhost:8080
```

#### Terminal 2 - Backend (Express)
```bash
cd d:\Afridh\ Studies\SOS\ APP\prompty-web-builder-main\prompty-web-builder-main
npm run server
# Server runs on http://localhost:3001
```

### Test Email Configuration
```bash
node -e "
import('./server/email-service.mjs').then(({ testEmailConfiguration }) => {
  testEmailConfiguration().then(result => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  });
})
"
```

---

## Feature Overview

### 1. Enhanced Registration

**Fields Collected:**
- Full Name
- Email
- Student/Register Number
- Password (with confirmation)

**Registration Methods:**
- Email & Password
- Google OAuth (with name & register number pre-fill)

**Flow:**
1. User fills in registration form
2. Can choose email/password OR Google OAuth
3. For Google OAuth, pre-filled name and register number are saved
4. Account created in Supabase
5. Redirected to login page

### 2. OTP Verification Login

**Flow:**
1. Student enters email and password
2. System generates 6-digit OTP
3. OTP sent to email (if email service configured)
4. Student enters OTP on verification screen
5. OTP verified in database
6. User redirected to dashboard

**OTP Features:**
- 10-minute expiration
- Resend functionality with 60-second cooldown
- 6-digit format validation
- Attempt tracking (max 5 attempts)
- Beautiful HTML email template

### 3. Google OAuth Integration

**Supported for:**
- Student login
- Student registration

**Flow:**
1. User clicks "Sign in with Google"
2. Redirected to Google consent screen
3. User grants permissions
4. Redirected back to app
5. User account created/updated
6. Logged in automatically

### 4. Real-Time Notifications

**NotificationCenter Component:**
- Fixed bottom-right corner
- Bell icon with unread badge
- Real-time Supabase subscriptions
- Toast notifications for new alerts
- Mark as read / Delete functionality
- 10 most recent notifications in panel

**Notification Types:**
- Alert (red)
- Success (green)
- Info (blue)
- Default (grey)

**Integration Points:**
- StudentDashboard
- AdminDashboard
- Auto-subscribes to user's notifications

---

## Testing

### Manual Testing Checklist

#### Registration
- [ ] Register with email and password
  - [ ] Full name required
  - [ ] Register number required
  - [ ] Password minimum 8 characters
  - [ ] Passwords must match
  - [ ] Can proceed to email verification

- [ ] Register with Google
  - [ ] Can fill name and register number first
  - [ ] Redirects to Google
  - [ ] Returns and auto-logs in
  - [ ] Profile created with Google data

#### Login
- [ ] Login with email/password
  - [ ] OTP sent successfully
  - [ ] Can enter OTP code
  - [ ] Accepts only 6 digits
  - [ ] Shows expiry time

- [ ] OTP Verification
  - [ ] Correct OTP allows login
  - [ ] Invalid OTP shows error
  - [ ] Can resend OTP
  - [ ] 60-second cooldown on resend
  - [ ] Error after 5 attempts

- [ ] Login with Google
  - [ ] Single click login
  - [ ] Redirects to dashboard

#### Notifications
- [ ] NotificationCenter visible
  - [ ] Bell icon in bottom-right
  - [ ] Badge shows unread count
  - [ ] Click opens notification panel
  - [ ] Notifications display with icons

- [ ] Real-Time Updates
  - [ ] New notifications appear instantly
  - [ ] Toast notification appears
  - [ ] Mark as read updates style
  - [ ] Delete removes notification

### Testing Email

#### Gmail Test
```bash
# Check if email was received
1. Login to Gmail
2. Look for emails from "Campus Security <your-email@gmail.com>"
3. Verify HTML template renders correctly
4. Check links and formatting
```

#### Backend Endpoint Test
```bash
# Using curl or Postman
POST http://localhost:3001/api/send-otp
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456",
  "userName": "Test User"
}

# Expected response:
{
  "success": true,
  "message": "OTP email sent successfully"
}
```

### Testing OTP in Database

#### Check OTP in Supabase
1. Go to Supabase Dashboard
2. Go to "SQL Editor"
3. Run query:
```sql
SELECT email, otp_code, created_at, expires_at, verified 
FROM otp_tokens 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Troubleshooting

### Email Not Sending

**Problem:** "Failed to send OTP email"

**Solutions:**
1. Check EMAIL_SERVICE and EMAIL_USER in .env
2. For Gmail: Verify app password (not regular password)
3. Check if 2FA is enabled on Gmail
4. Allow "Less secure apps" (Gmail) or check access permissions
5. Check network connectivity to SMTP server
6. Look at backend console for error details

### Google OAuth Not Working

**Problem:** "Authentication Failed" or redirect loop

**Solutions:**
1. Verify Google Client ID and Secret in Supabase
2. Check authorized redirect URIs include your current URL
3. Ensure Supabase Google provider is enabled
4. Check browser console for error details
5. Clear browser cookies and cache

### Notifications Not Appearing

**Problem:** No notifications shown in NotificationCenter

**Solutions:**
1. Check Supabase real-time is enabled
2. Verify user is logged in (required for notifications)
3. Check browser console for errors
4. Ensure notifications table has correct permissions (RLS policies)
5. Test by manually inserting notification in Supabase

### OTP Verification Failing

**Problem:** "Invalid or expired OTP"

**Solutions:**
1. Verify OTP is entered correctly (6 digits)
2. Check expiration time (10 minutes)
3. Ensure database has OTP record
4. Check OTP wasn't already used
5. Verify attempt count hasn't exceeded limit (5)

---

## File Structure

```
prompty-web-builder-main/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── OTPVerification.tsx       (OTP entry component)
│   │   │   ├── EnhancedRegistration.tsx  (Registration form)
│   │   │   └── GoogleOAuthButton.tsx     (Google sign-in button)
│   │   └── notifications/
│   │       └── NotificationCenter.tsx    (Real-time notifications)
│   ├── contexts/
│   │   └── AuthContext.tsx               (Updated with OAuth & OTP)
│   ├── pages/
│   │   ├── Auth.tsx                      (Updated auth page)
│   │   ├── StudentDashboard.tsx          (Added notifications)
│   │   └── AdminDashboard.tsx            (Added notifications)
├── server/
│   ├── email-service.mjs                 (Email sending service)
│   └── test-receiver.mjs                 (Updated with OTP endpoint)
├── supabase/
│   └── migrations/
│       └── 20251215_add_otp_and_notifications.sql
├── .env.example                          (Environment template)
└── .env.local                            (Your actual env vars)
```

---

## Security Considerations

### OTP Security
- OTP expires after 10 minutes
- Maximum 5 verification attempts per OTP
- OTP stored in database, not in browser
- Unique email+otp constraint prevents duplicates

### Email Security
- Never log passwords in console
- Use app passwords for Gmail (not regular password)
- Email sent over SMTP with TLS encryption
- Passwords stored in .env (gitignored)

### Real-Time Notifications
- RLS policies ensure users only see their notifications
- Admin can insert notifications
- Subscriptions authenticated via Supabase session

### Google OAuth
- Credentials stored securely in Supabase
- Redirect URIs validated
- Access tokens handled by Supabase SDK

---

## API Endpoints

### Backend Endpoints

#### Send OTP Email
```
POST /api/send-otp
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "otp": "123456",
  "userName": "John Doe"
}

Response:
{
  "success": true,
  "message": "OTP email sent successfully"
}
```

#### Get Recordings
```
GET /api/recordings

Response:
[
  {
    "filename": "video-alert-123-1234567890.webm",
    "type": "video",
    "size": 1024000,
    "timestamp": 1234567890
  },
  ...
]
```

#### Delete Recording
```
DELETE /api/recordings/:filename

Response:
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Next Steps

1. **Configure Supabase:**
   - Run database migration
   - Enable Google OAuth provider
   - Set up authentication policies

2. **Set Up Email Service:**
   - Create Gmail app password
   - Add email credentials to .env

3. **Test Features:**
   - Follow testing checklist above
   - Verify each component works

4. **Deploy (Future):**
   - Update Google redirect URIs for production domain
   - Configure production email service
   - Update Supabase production URL
   - Deploy to hosting platform

---

## Support & Debugging

For detailed debugging:

1. Check browser console (F12 → Console)
2. Check backend console for errors
3. Check Supabase logs (Dashboard → Logs)
4. Check email delivery (Gmail inbox)
5. Check database directly (Supabase → SQL Editor)

---

## Version History

- **v2.0** (Current) - Google OAuth, OTP, Notifications
- **v1.0** - Basic email/password authentication

---

For questions or issues, contact: security@campus.edu
