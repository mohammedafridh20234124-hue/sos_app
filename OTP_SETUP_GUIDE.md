# Email OTP Login System - Complete Setup Guide

## Files Created
1. **login.html** - Login page with OTP verification UI
2. **send_verification.php** - Sends OTP via email (PHPMailer)
3. **verify_otp.php** - Verifies OTP submitted by user
4. **student_page.html** - Protected dashboard (only logged-in users)

---

## Step 1: Install PHPMailer

PHPMailer is required to send emails. Install it using Composer:

```bash
composer require phpmailer/phpmailer
```

If you don't have Composer installed:
- Download from: https://getcomposer.org/download/
- Install it on your system
- Then run the command above in your project root

---

## Step 2: Set Up Gmail App Password

Since Gmail has strict security, you need to create an "App Password":

### A. Enable 2-Step Verification (if not already done)
1. Go to: https://myaccount.google.com/
2. Click "Security" on the left
3. Find "2-Step Verification" → Click it
4. Follow the setup process

### B. Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select: "Mail" and "Windows Computer"
3. Google will generate a 16-character password
4. **Copy this password**

---

## Step 3: Update send_verification.php

Open `send_verification.php` and replace these lines:

**Line 29 & 30:**
```php
$mail->Username = 'your-email@gmail.com';  // Replace with your Gmail
$mail->Password = 'your-app-password';      // Replace with Gmail App Password
```

**Also update Line 34:**
```php
$mail->setFrom('your-email@gmail.com', 'Campus Security Assistant');
```

### Example (with real values):
```php
$mail->Username = 'campussecurity@gmail.com';
$mail->Password = 'abcd efgh ijkl mnop';  // 16-char app password
$mail->setFrom('campussecurity@gmail.com', 'Campus Security Assistant');
```

---

## Step 4: Create OTP Data Directory

Create a folder to store OTP files:

### Windows (PowerShell):
```powershell
New-Item -ItemType Directory -Path "otp_data" -Force
```

### Mac/Linux (Terminal):
```bash
mkdir -p otp_data
chmod 755 otp_data
```

This folder will store temporary OTP files with 30-minute expiration.

---

## Step 5: Set Up Your Web Server

You have 3 options:

### Option A: Using Built-in PHP Server (Easiest)
```bash
php -S localhost:8000
```
Then open: http://localhost:8000/login.html

### Option B: Using Apache/XAMPP
1. Copy project to `htdocs` folder
2. Start Apache
3. Open: http://localhost/your-project/login.html

### Option C: Using Node.js Server
```bash
npx http-server
```

---

## Step 6: Test the System

### Test Flow:
1. **Open login page:** http://localhost:8000/login.html
2. **Enter email:** Your test email
3. **Click "Send OTP"** 
   - Check email inbox for 6-digit code
   - (Check spam folder if not found)
4. **Enter OTP code** in the form
5. **Click "Verify Code"**
   - Success → Redirected to student_page.html
   - Failure → Try again

### Example Test:
```
Email: your-test-email@gmail.com
OTP: (Check inbox for code like 123456)
```

---

## Step 7: Connect to Your React Dashboard (Optional)

If you want to integrate with your existing React app:

### Update redirect in login.html (Line 358):
**Before:**
```javascript
window.location.href = 'dashboard';
```

**After:**
```javascript
window.location.href = '/dashboard';  // Redirect to your React dashboard
```

### Update verify_otp.php (Line 48):
Add database storage:
```php
// Save to database
$_SESSION['verified_email'] = $email;
// Or save to database table 'verified_users'
```

---

## Security Checklist

✅ **Do These:**
- Use HTTPS in production (not HTTP)
- Keep PHPMailer updated
- Store OTP files outside web root
- Set 30-minute OTP expiration
- Clear OTP after verification
- Use strong session management

❌ **Don't Do These:**
- Don't hardcode credentials (use env variables in production)
- Don't send OTP via SMS (email is secure enough)
- Don't show full OTP in logs
- Don't store OTP in database unencrypted

---

## Troubleshooting

### Problem: "PHPMailer not found"
**Solution:**
```bash
composer require phpmailer/phpmailer
```

### Problem: Gmail says "Sign-in blocked"
**Solution:**
1. Enable "Less secure app access" (if needed)
2. Or better: Use App Password (Step 2 above)

### Problem: OTP not received in email
**Solution:**
1. Check spam/junk folder
2. Wait a few seconds (email takes time)
3. Check Gmail credentials are correct
4. Check internet connection

### Problem: "Invalid OTP" error
**Solution:**
1. Make sure you entered exactly 6 digits
2. OTP expires after 30 minutes
3. Refresh and request new OTP

### Problem: Redirect not working
**Solution:**
1. Check file paths are correct
2. Clear browser cache (Ctrl+F5)
3. Make sure files are in correct directory

---

## File Structure
```
project-root/
├── login.html              ← User login page
├── send_verification.php   ← Sends OTP email
├── verify_otp.php          ← Verifies OTP code
├── student_page.html       ← Protected dashboard
├── otp_data/               ← Stores OTP files (created in Step 4)
└── vendor/
    └── phpmailer/          ← Installed via composer
```

---

## API Endpoints

### Send OTP
```
POST /send_verification.php
Parameters:
  - email: user@example.com

Response:
{
  "status": "success",
  "message": "Verification code sent successfully",
  "email": "user@example.com"
}
```

### Verify OTP
```
POST /verify_otp.php
Parameters:
  - email: user@example.com
  - otp: 123456

Response:
{
  "status": "success",
  "message": "Email verified successfully",
  "email": "user@example.com",
  "verified_at": "2025-12-10 12:34:56"
}
```

---

## Need Help?

If something doesn't work:
1. Check console errors (F12 → Console tab)
2. Check server logs
3. Verify all credentials are correct
4. Make sure folders and files exist
5. Test with a fresh Gmail account

Good luck! 🚀
