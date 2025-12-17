# Phone Number Authentication & SMS OTP Setup

## Overview
Google OAuth has been replaced with a **Phone-based authentication system** using **Twilio** for SMS delivery.

## New Features

### 1. **Phone Authentication Methods**
- **Sign in with Email**: Email + Password → OTP verification
- **Sign in with Phone**: Phone number → SMS OTP verification
- **Sign up**: Create account with name, register number, email, and phone number

### 2. **Database Changes**
- Added `sms_otp_tokens` table for SMS OTP storage
- Added `phone` column to profiles table
- Migration file: `supabase/migrations/20251215_add_sms_otp.sql`

### 3. **Backend Services**
- **sms-service.mjs**: Handles email OTP and SMS OTP delivery
- Supports Twilio for production SMS
- Logs codes to console for testing

## Testing Locally (No Twilio Setup Required)

1. **Open your browser**: http://localhost:8081

2. **Try Phone Login**:
   - Click "Sign in with Phone"
   - Enter any phone number (e.g., `+1234567890`)
   - Click "Sign in with SMS"
   - **SMS code will be logged to console and stored locally**
   - Check your browser console (F12 → Console tab) for the code
   - Enter the 6-digit code to verify

3. **Try Email Login**:
   - Click "Sign in with Email"
   - Enter email and password
   - Click "Sign In with OTP"
   - **OTP will be logged to console**
   - Enter the code to verify

4. **Try Phone Signup**:
   - Click "Don't have an account? Sign up"
   - Fill in your details
   - Complete the signup flow

## Optional: Enable Real Twilio SMS

To send real SMS messages instead of logging to console:

### 1. Get Twilio Credentials
1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from the dashboard
3. Get or purchase a Twilio phone number
4. Create a file named `.env` in the root directory:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 2. Install Twilio SDK
```bash
npm install twilio
```

### 3. Start the Backend Service
```bash
npm run server
```

This will start the SMS service on port 3001.

### 4. Test SMS Delivery
- SMS codes will now be sent to real phone numbers via Twilio
- Make sure the phone numbers are in valid format with country code

## Environment Variables

Create a `.env` file in the root directory:

```
# Email Configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Twilio SMS Configuration (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Server Port
PORT=3001
```

## Files Changed/Created

### New Files:
- `src/components/auth/PhoneVerification.tsx` - Phone OTP verification UI
- `server/sms-service.mjs` - SMS and email delivery service
- `supabase/migrations/20251215_add_sms_otp.sql` - Database schema

### Modified Files:
- `src/contexts/AuthContext.tsx` - Added phone auth methods, removed Google OAuth
- `src/pages/Auth.tsx` - Added phone login/signup forms
- Removed: `src/components/auth/GoogleOAuthButton.tsx` - No longer needed

## API Endpoints

### Email OTP
```
POST /api/send-otp
Body: { email, otp, userName }
```

### SMS OTP
```
POST /api/send-sms-otp
Body: { phone, otp, userName }
```

### Health Check
```
GET /api/health
Response: { status, emailConfigured, twilioConfigured, timestamp }
```

## Troubleshooting

### SMS not sending?
1. Check console for error logs
2. Verify Twilio credentials in `.env`
3. Ensure phone number format includes country code (+1 for US)
4. Check Twilio account has credits

### OTP code not working?
1. Make sure code is entered within 10 minutes (expiry time)
2. Code is case-sensitive (6 digits)
3. Check browser console (F12) to see if SMS code was logged

### Can't see SMS code?
1. For testing: Check terminal/console output where server is running
2. For testing: SMS code is also stored in localStorage as `sms_<phone_number>`
3. For production: Enable Twilio with valid credentials

## Testing Credentials

### Admin Account (unchanged):
- Email: admin@campus.edu
- Password: admin123

### Student Phone Test:
- Phone: +1 (234) 567-8900
- SMS code will be logged to console during testing

## Next Steps

1. **Test phone login**: Try signing in with a phone number
2. **Configure Twilio** (optional): For real SMS delivery
3. **Configure Email** (optional): For real email OTP delivery
4. **Deploy**: Follow deployment guide when ready
