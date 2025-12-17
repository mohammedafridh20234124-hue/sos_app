# Dual App Architecture - Quick Reference

## What Was Done ✅

We've completely separated your project into two independent applications:

### 1. **ADMIN APP** (`/admin`)
- Separate login (email + password)
- Separate dashboard
- Separate authentication context
- Broadcast message management
- Isolated admin APIs
- Admin-only access

### 2. **STUDENT APP** (`/student`)
- Email + OTP verification login
- Student dashboard with chatbot
- SOS alert system
- Notifications
- Location sharing
- Completely independent from admin

### 3. **SHARED RESOURCES** (`/shared`)
- Only static assets (images, fonts, logos)
- NO logic files
- Both apps can use, but never modify

---

## File Structure at a Glance

```
admin/
  ├─ src/
  │  ├─ pages/AdminLogin.tsx ← Admin login page
  │  ├─ pages/AdminDashboard.tsx ← Admin dashboard
  │  ├─ contexts/AdminAuthContext.tsx ← Admin authentication
  │  ├─ hooks/useAdminAuth.ts ← Admin auth hook
  │  └─ App.tsx
  └─ api/
     ├─ admin-login.php ← Admin login endpoint
     └─ broadcast/ ← Broadcast endpoints

student/
  ├─ src/
  │  ├─ pages/StudentLogin.tsx ← Student login with OTP
  │  ├─ pages/StudentDashboard.tsx ← Student dashboard
  │  ├─ contexts/StudentAuthContext.tsx ← Student authentication
  │  ├─ hooks/useStudentAuth.ts ← Student auth hook
  │  └─ App.tsx
  └─ api/
     └─ auth/
        ├─ send_verification.php ← Send OTP email
        └─ verify_otp.php ← Verify OTP code
```

---

## How to Run Both Apps

### Terminal 1 - Admin App
```bash
cd admin
npm run dev
→ http://localhost:5174/admin/login
```

### Terminal 2 - Student App
```bash
cd student
npm run dev
→ http://localhost:5175/student/login
```

### Terminal 3 - PHP Server (for APIs)
```bash
php -S localhost:8000
```

---

## Login Credentials

### Admin Login
- Email: `admin@campussecurity.com`
- Password: (Configure in database)
- Feature: Broadcast messages to all students

### Student Login
- Email: Your student email
- OTP: Will be sent to email inbox (6-digit code)
- Feature: Dashboard with SOS, chat, notifications

---

## Key Features

### ✅ Admin App
- **Admin Dashboard** - Overview of all students and alerts
- **Broadcast Manager** - Send messages to all students
- **User Management** - Manage student accounts
- **Analytics** - View system statistics
- **Settings** - Configure system settings

### ✅ Student App
- **Login with OTP** - Secure email verification
- **SOS Alert** - One-tap emergency alert
- **Chat Assistant** - AI-powered campus assistant
- **Notifications** - Receive broadcast messages
- **Location Sharing** - Share location with trusted contacts
- **Dashboard** - Overview of all features

---

## Important: NO Cross-References

❌ **Don't do this:**
```tsx
import AdminAuth from '../../admin/src/contexts/...'
import StudentAuth from '../../student/src/contexts/...'
```

✅ **Do this:**
```tsx
// In ADMIN app only:
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'

// In STUDENT app only:
import { useStudentAuth } from '@/hooks/useStudentAuth'
import { StudentAuthProvider } from '@/contexts/StudentAuthContext'
```

---

## API Paths

### Admin API Calls
```javascript
// In admin/src/pages/AdminDashboard.tsx
fetch('/api/admin/broadcast/create.php')
fetch('/api/admin/broadcast/list.php')
fetch('/api/admin/broadcast/delete.php?id=123')
```

### Student API Calls
```javascript
// In student/src/pages/StudentLogin.tsx
fetch('/api/student/auth/send_verification.php')
fetch('/api/student/auth/verify_otp.php')
```

---

## Configuration Files

### Admin App
- `admin/package.json` - Admin dependencies
- `admin/vite.config.ts` - Admin build config
- `admin/tsconfig.json` - Admin TypeScript config

### Student App
- `student/package.json` - Student dependencies
- `student/vite.config.ts` - Student build config
- `student/tsconfig.json` - Student TypeScript config

### Shared
- `database/db.php` - Database connection (shared by both)
- `.env` files (if using environment variables)

---

## Testing Checklist

- [ ] Admin app opens at http://localhost:5174/admin/login
- [ ] Student app opens at http://localhost:5175/student/login
- [ ] Admin login works with credentials
- [ ] Admin dashboard loads after login
- [ ] Admin can send broadcasts
- [ ] Student login sends OTP to email
- [ ] Student can enter OTP and verify
- [ ] Student dashboard loads after login
- [ ] NO admin pages visible in student app
- [ ] NO student pages visible in admin app

---

## Deployment

### Separate Domains
```
Admin:   admin.campussecurity.com (points to /admin/dist)
Student: app.campussecurity.com (points to /student/dist)
```

### Same Domain
```
Admin:   campussecurity.com/admin (points to /admin/dist)
Student: campussecurity.com/app (points to /student/dist)
```

### Build for Production
```bash
# Build admin
cd admin && npm run build → admin/dist

# Build student
cd student && npm run build → student/dist

# Deploy admin/dist and student/dist to your server
```

---

## Environment Variables (if needed)

### .env.admin
```
VITE_API_BASE=http://localhost:8000
VITE_ADMIN_API=/api/admin
```

### .env.student
```
VITE_API_BASE=http://localhost:8000
VITE_STUDENT_API=/api/student
```

---

## Database Tables

Both apps share the same database but access different tables:

### Admin Tables
- `admins` - Admin users
- `broadcast_messages` - Broadcast messages
- `system_settings` - System configuration

### Student Tables
- `students` - Student accounts
- `chat_history` - Chat messages
- `notifications` - Notifications
- `student_messages` - Messages sent to students

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App won't start | Check npm install ran in correct folder |
| 404 on API calls | Check PHP server is running on port 8000 |
| OTP not sent | Check Gmail credentials in send_verification.php |
| Cross-app errors | Check imports don't reference other app |
| Database errors | Check database connection in db.php |

---

## Next Steps

1. ✅ Install dependencies: `npm install` in both admin and student
2. ✅ Configure database: Update `database/db.php`
3. ✅ Configure email: Update `student/api/auth/send_verification.php`
4. ✅ Create OTP folder: `mkdir otp_data`
5. ✅ Start all 3 servers (Admin, Student, PHP)
6. ✅ Test both apps independently
7. ✅ Build for production when ready

---

**Your apps are now completely independent and ready to scale! 🚀**

