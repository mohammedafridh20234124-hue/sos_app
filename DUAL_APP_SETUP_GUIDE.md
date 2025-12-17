# Dual App Architecture - Complete Setup Guide

## 📁 Project Structure (After Reorganization)

```
project-root/
│
├─ admin/                    # ✅ ADMIN APPLICATION (Completely Isolated)
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ AdminLogin.tsx
│  │  │  └─ AdminDashboard.tsx
│  │  ├─ contexts/
│  │  │  └─ AdminAuthContext.tsx
│  │  ├─ hooks/
│  │  │  └─ useAdminAuth.ts
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ api/
│  │  ├─ admin-login.php
│  │  ├─ admin-verify.php
│  │  └─ broadcast/
│  │     ├─ create.php
│  │     ├─ list.php
│  │     └─ delete.php
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ tsconfig.json
│
├─ student/                  # ✅ STUDENT APPLICATION (Completely Isolated)
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ StudentLogin.tsx
│  │  │  └─ StudentDashboard.tsx
│  │  ├─ contexts/
│  │  │  └─ StudentAuthContext.tsx
│  │  ├─ hooks/
│  │  │  └─ useStudentAuth.ts
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ api/
│  │  └─ auth/
│  │     ├─ send_verification.php
│  │     └─ verify_otp.php
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ tsconfig.json
│
├─ shared/                   # ✅ SHARED RESOURCES (Assets Only)
│  ├─ assets/
│  │  ├─ images/
│  │  ├─ icons/
│  │  ├─ fonts/
│  │  └─ logos/
│  └─ styles/
│     ├─ colors.css
│     └─ animations.css
│
├─ database/
│  └─ db.php                 # Shared database connection
│
├─ vendor/                   # PHPMailer and dependencies
│
├─ otp_data/                 # Temporary OTP storage
│
└─ Documentation Files

```

---

## 🔧 Setup Instructions

### Step 1: Install Dependencies for Both Apps

**Admin App:**
```bash
cd admin
npm install
```

**Student App:**
```bash
cd student
npm install
```

### Step 2: Install PHPMailer (Required for Student OTP)

```bash
composer require phpmailer/phpmailer
```

### Step 3: Configure Email (For OTP Verification)

Edit `student/api/auth/send_verification.php` (Lines 19-20):

```php
$mail->Username = 'your-email@gmail.com';     // Your Gmail
$mail->Password = 'your-app-password';        // Gmail App Password
```

Also update Line 34:
```php
$mail->setFrom('your-email@gmail.com', 'Campus Security Assistant');
```

### Step 4: Create OTP Data Folder

```bash
mkdir otp_data
```

### Step 5: Configure Database Connection

Edit `database/db.php` with your database credentials.

---

## 🚀 Running the Apps

### Option A: Development Mode (Separate Ports)

**Terminal 1 - Start Admin App:**
```bash
cd admin
npm run dev
# Admin runs on: http://localhost:5174
```

**Terminal 2 - Start Student App:**
```bash
cd student
npm run dev
# Student runs on: http://localhost:5175
```

**Terminal 3 - Start PHP Server:**
```bash
php -S localhost:8000
```

### Option B: Production Mode

Build both apps:
```bash
cd admin && npm run build
cd ../student && npm run build
```

Deploy `admin/dist` and `student/dist` to your server separately.

---

## 🔐 Authentication Isolation

### Admin Authentication
- **Location:** `admin/api/admin-login.php`
- **Context:** `AdminAuthContext`
- **Session Key:** `admin_id`, `admin_email`, `admin_role`
- **Files:** Only in `/admin` folder
- **Permissions:** Super admin access only

### Student Authentication
- **Location:** `student/api/auth/verify_otp.php`
- **Context:** `StudentAuthContext`
- **Session Key:** `verified_email`, `verified_at`
- **Files:** Only in `/student` folder
- **Permissions:** Email + OTP verification

### ✅ NO Cross-Reference
```tsx
// ❌ DON'T DO THIS:
import AdminContext from '../../admin/src/contexts/...'

// ✅ DO THIS:
// In Admin: use only AdminAuthContext
// In Student: use only StudentAuthContext
```

---

## 📊 API Endpoints

### Admin APIs
- `POST /api/admin/admin-login.php` - Admin login
- `GET /api/admin/admin-verify.php` - Verify session
- `POST /api/admin/broadcast/create.php` - Create broadcast
- `GET /api/admin/broadcast/list.php` - Get broadcasts
- `DELETE /api/admin/broadcast/delete.php` - Delete broadcast

### Student APIs
- `POST /api/student/auth/send_verification.php` - Send OTP
- `POST /api/student/auth/verify_otp.php` - Verify OTP
- (More student endpoints in future)

---

## 📋 Migration Checklist

- [ ] Create `/admin` and `/student` folders
- [ ] Move admin files to `/admin/src`
- [ ] Move student files to `/student/src`
- [ ] Update imports in TypeScript files
- [ ] Create separate `vite.config.ts` for each app
- [ ] Create separate `package.json` for each app
- [ ] Move admin API files to `/admin/api`
- [ ] Move student API files to `/student/api`
- [ ] Update PHP require paths (use relative paths)
- [ ] Create `otp_data/` folder
- [ ] Configure email credentials
- [ ] Test Admin login independently
- [ ] Test Student login with OTP independently
- [ ] Verify NO cross-app imports
- [ ] Test on separate ports

---

## 🧪 Testing Each App

### Test Admin App
```bash
# 1. Go to http://localhost:5174/admin/login
# 2. Enter admin credentials
# 3. Should see Admin Dashboard
# 4. Test broadcast functionality
```

### Test Student App
```bash
# 1. Go to http://localhost:5175/student/login
# 2. Enter email
# 3. Click "Send OTP"
# 4. Check email inbox for 6-digit code
# 5. Enter OTP
# 6. Should see Student Dashboard
```

---

## 🚨 Common Issues & Solutions

### Issue: "Module not found" errors
**Solution:**
Make sure you updated all import paths in:
- `/admin/src/App.tsx`
- `/student/src/App.tsx`
- All context files
- All hook files

### Issue: PHP files not found (404 errors)
**Solution:**
Check the API paths in your fetch calls match the file locations:
```
# Admin API should call:
/api/admin/admin-login.php

# Student API should call:
/api/student/auth/verify_otp.php
```

### Issue: OTP not being sent
**Solution:**
1. Check Gmail credentials are correct
2. Ensure 2-Step Verification is enabled on Gmail
3. Use Gmail App Password (not regular password)
4. Check `otp_data` folder exists and is writable

### Issue: Cross-app conflicts
**Solution:**
- Check NO imports between `/admin` and `/student`
- Each app should have its own contexts
- Each app should have its own routing

---

## 📦 Deployment Options

### Option 1: Separate Domains
```
Admin:   admin.campussecurity.com
Student: app.campussecurity.com
```

### Option 2: Same Domain, Different Paths
```
Admin:   campussecurity.com/admin
Student: campussecurity.com/app
```

### Option 3: Separate Servers
```
Admin:   admin-server.campussecurity.com:5174
Student: student-server.campussecurity.com:5175
```

---

## ✨ Key Benefits of This Architecture

✅ **Complete Isolation** - Admin and student apps don't interfere
✅ **Security** - Different authentication systems
✅ **Scalability** - Each app can scale independently
✅ **Maintainability** - Clear folder structure
✅ **Deployment** - Deploy separately to different servers
✅ **Development** - Multiple developers can work simultaneously
✅ **Testing** - Test each app independently
✅ **Performance** - Smaller bundle sizes per app

---

## 📞 Need Help?

If something doesn't work:
1. Check the file exists at the expected path
2. Check imports are correct (relative paths)
3. Check database connection is working
4. Check PHP version supports the code
5. Check permissions on `otp_data` folder
6. Review error messages in browser console (F12)
7. Check server logs for PHP errors

Good luck! 🚀

