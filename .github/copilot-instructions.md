# Copilot Instructions - Campus Security Emergency Response System

## Project Overview
This is a **Campus Emergency Response System** with a React + Vite frontend, Express backend, and Supabase PostgreSQL database. The system enables students to report emergencies via photos, audio recordings, and real-time notifications while admins manage responses.

---

## Architecture

### Frontend (React + TypeScript + Shadcn UI)
- **Framework**: Vite + React with TypeScript
- **Auth**: Supabase (email/password, SMS OTP, disabled Google OAuth)
- **Routes**: Protected routes via `ProtectedRoute` wrapper in `App.tsx`
  - `/` → Landing page
  - `/auth?role=student|admin` → Authentication
  - `/dashboard` → StudentDashboard (requires `student` role)
  - `/admin` → AdminDashboard (requires `admin` role)
- **Client**: `src/integrations/supabase/client.ts` exports `supabase` instance with `persistSession: true`

### Backend (Node.js Express)
- **Entry**: `npm run server` runs `server/sms-service.mjs` on port 3001
- **API Endpoints**:
  - `POST /api/send-otp` → sends email OTP via Nodemailer
  - `POST /api/send-sms-otp` → sends SMS OTP via Twilio
  - `GET /api/health` → returns service status
  - Recording upload endpoints store media to `server/uploads/`
- **Storage**: Recordings metadata persisted to `recordings-metadata.json` with binary buffers stored as `.buffer` files

### Database (Supabase PostgreSQL)
- **Real-time**: Supabase subscriptions enabled via `.on('*', callback)` pattern
- **Key Tables**:
  - `user_roles` → user ID + role (admin/student)
  - `otp_tokens` → email OTP with expiry (10 min) + attempt limiting (5 max)
  - `sms_otp_tokens` → phone OTP with same constraints
  - `notifications` → RLS policies ensure users see only their notifications
  - Custom profiles table with full_name, register_number, phone_number
- **Migrations**: `supabase/migrations/20251215_add_otp_and_notifications.sql` defines schema + RLS policies

---

## Data Flow Patterns

### OTP Authentication Flow
```
1. User enters email → sendOTP() in AuthContext
2. AuthContext.sendOTP() → Generate 6-digit OTP → DB insert otp_tokens
3. Backend POST /api/send-otp → Nodemailer sends email
4. User enters OTP → verifyOTP() checks DB + increments attempt_count
5. Success → signIn() with temp Supabase session
```

### Real-Time Notifications
```
1. Admin posts notification → Inserted to notifications table
2. Frontend NotificationCenter subscribes: supabase.from('notifications').on('*', ...)
3. Real-time event triggers → UI updates via state setter
4. RLS policies restrict visibility: `auth.uid()` = notifications.user_id
```

### Recording Upload
```
1. StudentDashboard captures photo/audio → Binary buffer
2. POST to backend with recording metadata (userId, alertId, location)
3. Backend saves buffer to disk + metadata to recordingsByUser object
4. saveRecordingsToDisk() persists metadata JSON + individual .buffer files
5. Admin dashboard retrieves recordings via GET endpoints
```

---

## Key Code Patterns

### Authentication Context (`src/contexts/AuthContext.tsx`)
- **Methods**: `signIn()`, `signUp()`, `sendOTP()`, `verifyOTP()`, `sendSMSOTP()`, `verifySMSOTP()`, `signOut()`
- **State**: `user`, `session`, `userRole`, `loading`
- **Auth listener**: `supabase.auth.onAuthStateChange()` syncs session
- **User role fetch**: After session established, queries `user_roles` table for role
- **Pattern**: All async methods return `{ error, success? }` object

### Component Structure
- **UI Components**: Shadcn UI (Button, Input, Card, Label, etc.) imported from `@/components/ui/`
- **Auth Components**: Use OTPVerification, EnhancedRegistration, PhoneVerification, GoogleOAuthButton (disabled)
- **Custom Hooks**: `useAuth()` from AuthContext, `useToast()` from Sonner
- **Icon Library**: Lucide-react icons throughout

### Supabase Client Pattern
```typescript
import { supabase } from "@/integrations/supabase/client";
// Query: supabase.from('table_name').select(...).eq('field', value)
// Insert: supabase.from('table_name').insert({...})
// Subscribe: supabase.from('table_name').on('*', callback)
```

### Backend Service Pattern (Node.js/Express)
- **Middleware**: CORS enabled for frontend cross-origin requests
- **Email**: Uses Nodemailer with `process.env.EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`
- **OTP Generation**: `Math.floor(100000 + Math.random() * 900000).toString()` for 6-digit codes
- **Response Format**: Return `{ success, error, data? }` JSON objects
- **Environment**: Load from `.env` via `dotenv.config()`

---

## Critical Developer Workflows

### Build & Run
```bash
# Terminal 1 - Frontend (port 8080)
npm run dev                 # Vite dev server with hot reload

# Terminal 2 - Backend (port 3001)
npm run server              # Node.js Express server

# Build for production
npm run build               # Creates dist/ folder (Vite)
npm run lint                # ESLint check
```

### Database
```bash
# Apply migrations
supabase db push            # Push migrations to Supabase

# Manual SQL in Supabase dashboard if needed
# Schema defined in: supabase/migrations/20251215_add_otp_and_notifications.sql
```

### API Testing
- Test `/api/send-otp` with Postman: `{ email, otp, userName }`
- Backend health: `GET http://localhost:3001/api/health`
- Check browser console (F12) for client-side errors
- Check terminal output for backend logs

### Configuration
- **Frontend env**: Create `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Backend env**: Create `.env` with email/SMS credentials (`EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `TWILIO_*`)
- **Example**: See `.env.example` for required variables

---

## Project-Specific Conventions

### TypeScript Patterns
- **No implicit any**: `noImplicitAny: false` (strict types not enforced globally, but use them in new code)
- **Path alias**: `@/` points to `src/` directory
- **React imports**: Use named imports for components, default for pages

### API Backend Design
- **Single backend file**: `sms-service.mjs` handles both SMS and email OTP
- **Persistent state**: Recordings stored to disk via JSON + binary .buffer file pattern
- **URL detection**: Backend distinguishes localhost vs production via `window.location.hostname`

### UI Conventions
- **Shadcn components**: Fully styled with Tailwind, no custom CSS needed
- **Icons**: Lucide icons with naming convention (Mail, Loader2, AlertCircle, etc.)
- **Notifications**: Sonner toast library for user feedback
- **Forms**: React Hook Form + Zod for validation (seen in EnhancedRegistration)

### Security Practices
- **OTP expiry**: 10 minutes enforced at DB level
- **Attempt limiting**: Max 5 attempts per OTP code
- **RLS policies**: Supabase Row Level Security restricts data visibility
- **Password**: Min 8 characters, confirmation required, Supabase encrypted
- **Environment secrets**: Never commit `.env`, use `.env.local`

---

## Common Issues & Debugging

### CORS Errors
- Backend must run on port 3001 (hardcoded in frontend)
- Verify `app.use(cors())` in `sms-service.mjs`

### OTP Not Sending
- Check `.env` email credentials (Gmail requires app password, not regular password)
- Verify `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD` set
- Check backend logs for Nodemailer errors

### Real-time Notifications Not Working
- Verify `supabase.from('notifications').on('*', ...)` subscription active (browser DevTools)
- Check RLS policies in migration file allow current user
- Ensure Supabase project has real-time subscriptions enabled

### Recording Persistence Issues
- Backend saves to `server/uploads/recordings-metadata.json`
- On restart, `loadRecordingsFromDisk()` rebuilds in-memory state from disk files
- Check file permissions in `server/uploads/`

---

## Integration Points

### Frontend ↔ Backend
- CORS-enabled requests to `http://localhost:3001/api/*` (or production hostname)
- All endpoints return `{ success, error, data? }` format

### Frontend ↔ Supabase
- Auth state synced via `onAuthStateChange` listener
- Queries/inserts via `supabase.from('table').select/insert/update`
- Real-time updates via `.on('*', callback)` subscriptions

### Backend ↔ External Services
- **Email**: Nodemailer SMTP (Gmail/Outlook/custom)
- **SMS**: Twilio API (optional, via environment variables)

---

## File Structure Reference

```
src/
├── components/
│   ├── auth/
│   │   ├── OTPVerification.tsx          # OTP entry form
│   │   ├── PhoneVerification.tsx        # SMS OTP form
│   │   ├── EnhancedRegistration.tsx    # Registration with fields
│   │   └── GoogleOAuthButton.tsx        # Disabled
│   ├── notifications/
│   │   └── NotificationCenter.tsx       # Real-time notifications
│   └── ui/                              # Shadcn components
├── contexts/
│   └── AuthContext.tsx                  # Auth methods + state
├── pages/
│   ├── Auth.tsx                         # Login/signup page
│   ├── StudentDashboard.tsx             # Student with recordings
│   └── AdminDashboard.tsx               # Admin with notifications
├── integrations/supabase/
│   └── client.ts                        # Supabase instance
└── App.tsx                              # Routes + ProtectedRoute

server/
├── sms-service.mjs                      # Express backend (port 3001)
├── email-service.mjs                    # Email sending utility
└── uploads/                             # Recording storage

supabase/
└── migrations/
    └── 20251215_add_otp_and_notifications.sql
```

---

## When Adding Features

1. **Frontend**: Place components in appropriate folder, use Shadcn UI, import from `@/` paths
2. **Database**: Add migrations to `supabase/migrations/`, apply via `supabase db push`
3. **Backend**: Add endpoints to `server/sms-service.mjs`, return `{ success, error? }` format
4. **Auth**: Update `AuthContext.tsx` methods if changing auth flows
5. **Types**: Use TypeScript even though not fully strict
6. **Real-time**: Add Supabase subscription in useEffect, unsubscribe on cleanup
