# 🚀 Deploy to Vercel - Complete Guide

## Prerequisites

1. ✅ Code committed to GitHub
2. ✅ GitHub account
3. ✅ Vercel account (free)

---

## Step 1: Push Code to GitHub (If Not Done)

### Create GitHub Repository

1. Go to: **https://github.com/new**
2. **Repository name:** `campus-guardian-sos`
3. **Description:** "Campus Guardian SOS - Emergency Alert System"
4. **Visibility:** Public (recommended for free hosting)
5. **⚠️ DO NOT** check "Add a README file" or "Add .gitignore"
6. Click **"Create repository"**

### Push Your Code

```powershell
cd "H:\backup\another one\sos_app\prompty-web-builder-main"
$env:PATH = "C:\Program Files\Git\bin;$env:PATH"

# Add your GitHub repository (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Authentication:** Use Personal Access Token as password
- Create token: https://github.com/settings/tokens
- Select `repo` scope

---

## Step 2: Deploy Frontend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/signup
2. **Sign up** with GitHub (easiest way)
3. **Click:** "Add New Project"
4. **Import** your GitHub repository:
   - Select `campus-guardian-sos` (or your repo name)
   - Click "Import"

5. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (or leave default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

6. **Environment Variables:**
   Add these in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   VITE_API_URL=https://your-backend-url.vercel.app
   ```

7. **Click:** "Deploy"

### Option B: Via Vercel CLI

```powershell
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd "H:\backup\another one\sos_app\prompty-web-builder-main"
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? campus-guardian-sos
# - Directory? ./
# - Override settings? No
```

---

## Step 3: Deploy Backend Server

**Important:** Vercel is primarily for frontend. Your backend server needs separate hosting.

### Option A: Deploy Backend to Vercel (Serverless Functions)

Convert your Express server to Vercel serverless functions.

### Option B: Deploy Backend to Railway/Render (Recommended)

**Railway (Easiest):**
1. Go to: https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory: `server/`
6. Add environment variables
7. Deploy

**Render:**
1. Go to: https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server/sms-service.mjs`
   - **Environment:** Node
6. Add environment variables
7. Deploy

### Option C: Keep Backend on Local/Server

If you have a server, keep backend running there and update frontend API URL.

---

## Step 4: Update Frontend API Configuration

After deploying backend, update your frontend to use the production API URL.

### Update `vite.config.ts` or create environment variable:

```typescript
// In your code, use:
const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://your-backend-url.railway.app';
```

### Update Vercel Environment Variables:

In Vercel dashboard → Your Project → Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-url.railway.app
```

---

## Step 5: Configure CORS

Update your backend server to allow requests from your Vercel domain:

```javascript
// In server/sms-service.mjs
const allowedOrigins = [
  'https://your-app.vercel.app',
  'http://localhost:8080'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

---

## Step 6: Update Capacitor Config (For Mobile App)

If deploying mobile app, update `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sos.campusguardian',
  appName: 'Campus Guardian',
  webDir: 'dist',
  server: {
    url: 'https://your-app.vercel.app', // Your Vercel URL
    cleartext: false
  }
};

export default config;
```

---

## Step 7: Verify Deployment

1. **Frontend:** Visit your Vercel URL (e.g., `https://campus-guardian-sos.vercel.app`)
2. **Backend:** Test API endpoint (e.g., `https://your-backend.railway.app/api/health`)
3. **Check:** Browser console for any errors
4. **Test:** Full functionality (login, SOS alerts, etc.)

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors

### API Calls Fail
- Verify CORS configuration
- Check backend URL in environment variables
- Ensure backend is deployed and running

### Environment Variables Not Working
- Redeploy after adding variables
- Check variable names (must start with `VITE_` for Vite)
- Restart deployment

---

## Quick Reference

**Frontend (Vercel):**
- URL: `https://your-app.vercel.app`
- Framework: Vite
- Build: `npm run build`
- Output: `dist/`

**Backend (Railway/Render):**
- URL: `https://your-backend.railway.app`
- Runtime: Node.js
- Start: `node server/sms-service.mjs`
- Port: Auto-assigned

---

## Next Steps After Deployment

1. ✅ Update Supabase CORS settings to allow your Vercel domain
2. ✅ Test all features on production
3. ✅ Set up custom domain (optional)
4. ✅ Configure SSL certificates (automatic on Vercel)
5. ✅ Set up monitoring and error tracking

---

**Need help?** Share your GitHub repository URL and I can help with specific deployment steps!

