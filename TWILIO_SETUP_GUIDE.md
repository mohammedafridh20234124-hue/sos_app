# How to Get Your Twilio Credentials

## Step 1: Get Your Twilio Credentials

1. **Go to Twilio Dashboard**: https://www.twilio.com/console
2. **Find your Account SID**: Displayed on the dashboard (looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxx`)
3. **Find your Auth Token**: Displayed next to Account SID (click to reveal)
4. **Get your Twilio Phone Number**: 
   - Go to **Phone Numbers** in the left menu
   - If you don't have one, click **+ Get a Phone Number** and choose a number
   - Your number will look like: `+1 (555) 123-4567`

## Step 2: Add Credentials to .env File

Edit `.env` and replace:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token_here
TWILIO_PHONE_NUMBER=+1 (555) 123-4567
```

**Example .env:**
```
VITE_SUPABASE_PROJECT_ID="lkxprmsqmtwfouyvoyqx"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
VITE_SUPABASE_URL="https://lkxprmsqmtwfouyvoyqx.supabase.co"
VITE_ADMIN_SERVER_URL=http://localhost:3001/api/receive
VITE_ADMIN_API_KEY=

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=auth_token_here
TWILIO_PHONE_NUMBER=+1 (555) 123-4567
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
PORT=3001
```

## Step 3: Start the Backend Service

Run this in a NEW terminal:

```powershell
cd "d:\Afridh Studies\SOS APP\prompty-web-builder-main\prompty-web-builder-main"
npm install twilio
npm run server
```

You should see:
```
🚀 Backend server running on http://localhost:3001
📱 Twilio SMS: Configured
📧 Email service: Configured
```

## Step 4: Test SMS Sending

1. **Keep frontend running**: http://localhost:8081
2. **Keep backend running**: http://localhost:3001
3. **Go to phone login**: Click "Sign in with Phone"
4. **Enter a phone number** (the phone you want to receive SMS on)
5. **Click "Sign in with SMS"**
6. **Check your phone** - you should receive an SMS with the verification code!

## Troubleshooting

### SMS not arriving?
- Check that Twilio account has credits/active trial
- Verify phone number format (must include country code: +1)
- Check backend console for errors (terminal where `npm run server` runs)
- Make sure Twilio phone number is correct in `.env`

### Backend won't start?
- Make sure twilio is installed: `npm install twilio`
- Check port 3001 is not in use
- Verify `.env` file is in the root directory

### Getting "TWILIO_ACCOUNT_SID undefined"?
- Make sure you added credentials to `.env`
- Restart the backend service: `npm run server`
- Stop and start again if it was running

## Next Steps After SMS Works

1. ✅ Test phone SMS login
2. ✅ Test email OTP login
3. ✅ Test sign up with phone number
4. ✅ Verify notifications appear on dashboard
5. 📱 Send test alerts to see SMS notifications
