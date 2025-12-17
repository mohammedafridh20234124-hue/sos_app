# Dual App Architecture - Visual Guide

## 🎯 High-Level Overview

```
                    ┌─────────────────────────────────────────────┐
                    │         Your Campus Security App             │
                    │         (Now Two Independent Apps)           │
                    └─────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
            │   ADMIN APP  │    │ STUDENT APP  │   │   SHARED     │
            │              │    │              │   │   RESOURCES  │
            │ /admin       │    │ /student     │   │ /shared      │
            │              │    │              │   │              │
            ├──────────────┤    ├──────────────┤   ├──────────────┤
            │ Admin Login  │    │Student Login │   │ Images       │
            │ Admin Panel  │    │ OTP Verify   │   │ Fonts        │
            │ Broadcast    │    │ Dashboard    │   │ Colors.css   │
            │ Management   │    │ SOS Alert    │   │ Icons        │
            │              │    │ Chatbot      │   │              │
            └──────────────┘    └──────────────┘   └──────────────┘
                    │                   │
                    └───────────┬───────┘
                                │
                        ┌───────▼────────┐
                        │  Database      │
                        │  /database/db  │
                        └────────────────┘
```

---

## 🔐 Authentication Flow

### Admin Authentication Path

```
User visits /admin/login
           │
           ▼
    ┌──────────────────┐
    │ AdminLogin.tsx   │
    │ (Email + Pass)   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ POST /api/admin/..php    │
    │ (admin-login.php)        │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ AdminAuthContext         │
    │ Sets admin session       │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ AdminDashboard   │
    │ (Broadcasts)     │
    └──────────────────┘
```

### Student Authentication Path

```
User visits /student/login
           │
           ▼
    ┌──────────────────┐
    │ StudentLogin.tsx │
    │ (Enter email)    │
    └────────┬─────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ POST /api/student/auth/..   │
    │ send_verification.php       │
    │ (Generates OTP)             │
    └────────┬────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Email with OTP   │ ◄── Sent via PHPMailer
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ User enters OTP code     │
    └────────┬─────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ POST /api/student/auth/..   │
    │ verify_otp.php              │
    │ (Verifies code)             │
    └────────┬────────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ StudentAuthContext       │
    │ Sets verified_email      │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ StudentDashboard │
    │ (SOS, Chat, etc) │
    └──────────────────┘
```

---

## 📁 File Locations

### Admin Files (ONLY in /admin)
```
Admin App
│
├─ /admin/src/
│  ├─ pages/
│  │  ├─ AdminLogin.tsx           ← Admin login UI
│  │  └─ AdminDashboard.tsx       ← Admin dashboard UI
│  ├─ contexts/
│  │  └─ AdminAuthContext.tsx     ← Admin authentication
│  ├─ hooks/
│  │  └─ useAdminAuth.ts          ← Admin auth hook
│  └─ App.tsx                     ← Admin routing
│
└─ /admin/api/
   ├─ admin-login.php             ← Login endpoint
   ├─ admin-verify.php            ← Session verification
   └─ broadcast/                  ← Broadcast endpoints
```

### Student Files (ONLY in /student)
```
Student App
│
├─ /student/src/
│  ├─ pages/
│  │  ├─ StudentLogin.tsx         ← Student login UI
│  │  └─ StudentDashboard.tsx     ← Student dashboard UI
│  ├─ contexts/
│  │  └─ StudentAuthContext.tsx   ← Student authentication
│  ├─ hooks/
│  │  └─ useStudentAuth.ts        ← Student auth hook
│  └─ App.tsx                     ← Student routing
│
└─ /student/api/
   └─ auth/
      ├─ send_verification.php    ← Send OTP email
      └─ verify_otp.php           ← Verify OTP code
```

### Shared Files (Available to both)
```
Shared Resources
│
├─ /shared/assets/
│  ├─ images/
│  ├─ icons/
│  ├─ fonts/
│  └─ logos/
│
└─ /shared/styles/
   ├─ colors.css
   └─ animations.css
```

---

## 🔄 Data Flow Diagram

### Admin App Data Flow
```
┌─────────────────┐
│  Admin User     │
└────────┬────────┘
         │ (Login)
         ▼
┌──────────────────────┐
│  AdminLogin.tsx      │
│  (Credentials)       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  admin-login.php     │
│  (Verify in DB)      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Session Created     │
│  (admin_id, role)    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  AdminDashboard      │
│  (Show broadcasts)   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Send Broadcast      │
│  (POST to API)       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Save to Database    │
└──────────────────────┘
```

### Student App Data Flow
```
┌─────────────────┐
│ Student User    │
└────────┬────────┘
         │ (Enter email)
         ▼
┌──────────────────────┐
│  StudentLogin.tsx    │
│  (Email address)     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ send_verification.php│
│ (Generate OTP)       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  PHPMailer           │
│  (Send via Gmail)    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Email to Student    │
│  (With OTP code)     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Student enters OTP  │
│  (6-digit code)      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ verify_otp.php       │
│ (Check OTP valid?)   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Session Created     │
│  (verified_email)    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  StudentDashboard    │
│  (SOS, Chat, etc)    │
└──────────────────────┘
```

---

## 🌐 API Endpoint Map

### Admin API Endpoints
```
Admin App
│
├─ POST /api/admin/admin-login.php
│  │ Input: email, password
│  └─ Output: {status, admin}
│
├─ GET /api/admin/admin-verify.php
│  │ Input: (from session)
│  └─ Output: {status, admin}
│
└─ /api/admin/broadcast/
   ├─ POST create.php
   │  │ Input: title, message
   │  └─ Output: {status}
   ├─ GET list.php
   │  │ Input: (from session)
   │  └─ Output: {broadcasts}
   └─ DELETE delete.php
      │ Input: id
      └─ Output: {status}
```

### Student API Endpoints
```
Student App
│
└─ /api/student/auth/
   ├─ POST send_verification.php
   │  │ Input: email
   │  └─ Output: {status, message}
   │
   └─ POST verify_otp.php
      │ Input: email, otp
      └─ Output: {status, message}
```

---

## 🚀 Deployment Architecture

### Development Environment
```
Your Machine
│
├─ localhost:5174  ← Admin App (npm run dev)
├─ localhost:5175  ← Student App (npm run dev)
└─ localhost:8000  ← PHP Server (php -S localhost:8000)
```

### Production Environment
```
Your Server
│
├─ admin.yourdomain.com     → /admin/dist (Admin build)
├─ app.yourdomain.com       → /student/dist (Student build)
└─ api.yourdomain.com       → /api (PHP endpoints)
```

---

## 🔒 Security Isolation

### NO Cross-App Access Allowed
```
❌ WRONG:
admin/src/pages/AdminDashboard.tsx
  ├─ import StudentAuth from '../../student/src/...' ✗
  └─ import StudentContext from '../../student/...' ✗

✅ CORRECT:
admin/src/pages/AdminDashboard.tsx
  ├─ import { useAdminAuth } from '@/hooks/...' ✓
  └─ import { AdminAuthContext } from '@/contexts/...' ✓
```

### Authentication Isolation
```
Admin Authentication
├─ Session Key: admin_id
├─ Context: AdminAuthContext
├─ Hook: useAdminAuth()
└─ ❌ Student Cannot Access

Student Authentication
├─ Session Key: verified_email
├─ Context: StudentAuthContext
├─ Hook: useStudentAuth()
└─ ❌ Admin Cannot Access
```

---

## 📊 Folder Size Reference

```
admin/                ~150KB (React + TypeScript)
  ├─ src/            ~80KB
  ├─ dist/           ~45KB (after build)
  └─ node_modules/   ~500MB (npm dependencies)

student/             ~250KB (React + TypeScript)
  ├─ src/            ~150KB
  ├─ dist/           ~85KB (after build)
  └─ node_modules/   ~500MB (npm dependencies)

shared/              ~10KB
  ├─ assets/         ~5KB
  └─ styles/         ~5KB

total/               ~1.5GB (with node_modules)
```

---

## 🎓 Learning Path

### For Admin Developers
1. Read `DUAL_APP_QUICK_REFERENCE.md`
2. Understand `/admin/src/contexts/AdminAuthContext.tsx`
3. Look at `/admin/src/pages/AdminLogin.tsx`
4. Check `/admin/api/admin-login.php`
5. Start building admin features

### For Student Developers
1. Read `DUAL_APP_QUICK_REFERENCE.md`
2. Understand `/student/src/contexts/StudentAuthContext.tsx`
3. Look at `/student/src/pages/StudentLogin.tsx`
4. Check `/student/api/auth/verify_otp.php`
5. Start building student features

---

## ✅ Benefits of This Architecture

```
┌─────────────────────────────────────────┐
│  Independent Apps                       │
│  - Separate codebase                    │
│  - Separate team development            │
│  - Separate deployment                  │
│  - Separate scaling                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Different Authentication                │
│  - Admin: Email + Password              │
│  - Student: Email + OTP                 │
│  - NO cross-app access                  │
│  - Complete isolation                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Professional Structure                 │
│  - Clear organization                   │
│  - Easy navigation                      │
│  - Scalable design                      │
│  - Industry standard                    │
└─────────────────────────────────────────┘
```

---

**Your project is now architected like a professional enterprise application! 🚀**

