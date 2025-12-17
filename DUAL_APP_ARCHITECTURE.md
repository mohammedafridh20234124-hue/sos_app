# Project Structure - Dual App Architecture

## Complete Folder Structure

```
project-root/
│
├── admin/                          # ADMIN APPLICATION
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   ├── vite-env.d.ts
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── AdminLogin.tsx          # Admin login page
│   │   │   ├── AdminDashboard.tsx      # Admin dashboard
│   │   │   ├── BroadcastManager.tsx    # Broadcast messages
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── SidebarAdmin.tsx
│   │   │   ├── BroadcastForm.tsx
│   │   │   └── BroadcastList.tsx
│   │   ├── contexts/
│   │   │   ├── AdminAuthContext.tsx
│   │   │   └── AdminThemeContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAdminAuth.ts
│   │   │   └── useBroadcast.ts
│   │   ├── lib/
│   │   │   └── admin-utils.ts
│   │   └── integrations/
│   │       └── admin-api/
│   ├── api/                        # Admin API routes
│   │   ├── admin-login.php
│   │   ├── admin-verify.php
│   │   └── broadcast/
│   │       ├── create.php
│   │       ├── list.php
│   │       ├── update.php
│   │       └── delete.php
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.admin
│
├── student/                        # STUDENT APPLICATION
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   ├── vite-env.d.ts
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── StudentLogin.tsx        # Student login
│   │   │   ├── StudentDashboard.tsx    # Student dashboard
│   │   │   ├── SOSAlert.tsx            # SOS button
│   │   │   ├── ChatBot.tsx             # Chatbot
│   │   │   ├── LocationSharing.tsx     # Location share
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── StudentHeader.tsx
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── NotificationPanel.tsx
│   │   │   └── LocationMap.tsx
│   │   ├── contexts/
│   │   │   ├── StudentAuthContext.tsx
│   │   │   ├── StudentThemeContext.tsx
│   │   │   └── ChatContext.tsx
│   │   ├── hooks/
│   │   │   ├── useStudentAuth.ts
│   │   │   ├── useChat.ts
│   │   │   └── useLocation.ts
│   │   ├── lib/
│   │   │   └── student-utils.ts
│   │   └── integrations/
│   │       └── student-api/
│   ├── api/                        # Student API routes
│   │   ├── student-login.php
│   │   ├── student-verify.php
│   │   ├── auth/
│   │   │   ├── send_verification.php
│   │   │   └── verify_otp.php
│   │   ├── chat/
│   │   │   ├── get-faq.php
│   │   │   ├── save-message.php
│   │   │   └── get-history.php
│   │   └── notifications/
│   │       ├── get.php
│   │       └── mark-read.php
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.student
│
├── shared/                         # SHARED RESOURCES (No logic!)
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   ├── fonts/
│   │   └── logos/
│   ├── styles/
│   │   ├── colors.css
│   │   ├── typography.css
│   │   └── animations.css
│   └── utils/
│       └── shared-constants.ts
│
├── database/                       # Shared database config
│   └── db.php
│
├── root-level-config/
│   ├── .env                        # Master environment (rarely used)
│   ├── package.json                # Root package (if needed)
│   ├── README.md
│   └── ARCHITECTURE.md             # Documentation

```

---

## Key Points

### ✅ Admin App (/admin)
- Complete isolation from student code
- Admin-only authentication (different session/token)
- Admin routing in its own Router
- Admin API endpoints (api/admin-*)
- Admin-only context providers
- Admin components only
- Can be deployed to separate server/domain

### ✅ Student App (/student)
- Complete isolation from admin code
- Student authentication (email + OTP)
- Student routing in its own Router
- Student API endpoints (api/student-*, api/auth/*)
- Student-only context providers
- Student components only
- Can be deployed to separate server/domain

### ✅ Shared Resources (/shared)
- **ONLY** static assets (images, fonts, logos)
- **ONLY** shared CSS variables/animations
- **NO** logic, NO components, NO authentication
- **NO** API calls
- Both apps can reference, but never modify

### ✅ Database (/database)
- Single db.php for database connection
- Used by both admin and student API routes
- Keep it in root or shared location

---

## Deployment Options

### Option 1: Separate Domains
- Admin: admin.campussecurity.com → points to /admin folder
- Student: app.campussecurity.com → points to /student folder

### Option 2: Separate Ports (Development)
- Admin runs on: localhost:5174
- Student runs on: localhost:5175

### Option 3: Same Domain, Different Paths
- Admin: campussecurity.com/admin
- Student: campussecurity.com/app

---

## Migration Checklist

- [ ] Create /admin and /student folder structures
- [ ] Move admin files to /admin
- [ ] Move student files to /student
- [ ] Update imports in all TypeScript files
- [ ] Create separate package.json for each app
- [ ] Create separate vite.config.ts for each app
- [ ] Create separate .env files (.env.admin, .env.student)
- [ ] Update PHP include paths in API files
- [ ] Update database references
- [ ] Test admin app independently
- [ ] Test student app independently
- [ ] Verify no cross-references between apps

---

## No File Should Reference Between Apps

❌ **BAD** (Don't do this):
```tsx
import AdminComponent from '../../admin/src/components/AdminHeader'
import StudentComponent from '../../student/src/components/StudentHeader'
```

✅ **GOOD** (Do this):
```tsx
// In /admin, only import from /admin or /shared
import AdminComponent from '../components/AdminHeader'
import sharedColors from '../../shared/styles/colors.css'

// In /student, only import from /student or /shared
import StudentComponent from '../components/StudentHeader'
import sharedColors from '../../shared/styles/colors.css'
```

