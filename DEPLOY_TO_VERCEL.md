# 🚀 Deploy Campus Guardian SOS to Vercel - Step by Step

## 📋 Prerequisites Checklist

- [ ] GitHub account
- [ ] Code pushed to GitHub repository
- [ ] Vercel account (free signup)
- [ ] Supabase project created
- [ ] Backend hosting ready (Railway/Render)

---

## Step 1: Push Code to GitHub (If Not Done)

### 1.1 Create GitHub Repository

1. Go to: **https://github.com/new**
2. **Repository name:** `campus-guardian-sos`
3. **Description:** "Campus Guardian SOS - Emergency Alert System"
4. **Visibility:** Public (recommended)
5. **⚠️ DO NOT** check "Add a README file"
6. Click **"Create repository"**

### 1.2 Push Your Code

```powershell
cd "H:\backup\another one\sos_app\prompty-web-builder-main"
$env:PATH = "C:\Program Files\Git\bin;$env:PATH"

# Add remote (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Need a Personal Access Token?**
- Go to: https://github.com/settings/tokens
- Generate new token (classic)
- Select `repo` scope
- Use token as password when pushing

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Sign Up / Login to Vercel

1. Go to: **https://vercel.com/signup**
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub

### 2.2 Import Your Project

1. Click **"Add New Project"** (or "New Project")
2. **Import Git Repository:**
   - Find `campus-guardian-sos` (or your repo name)
   - Click **"Import"**

### 2.3 Configure Project Settings

**Framework Preset:** Vite (should auto-detect)

**Build Settings:**
- **Root Directory:** `./` (leave default)
- **Build Command:** `npm run build` (auto-filled)
- **Output Directory:** `dist` (auto-filled)
- **Install Command:** `npm install` (auto-filled)

### 2.4 Add Environment Variables

Click **"Environment Variables"** and add:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_URL=https://your-backend-url.railway.app
```

**Where to find Supabase credentials:**
1. Go to your Supabase project
2. Settings → API
3. Copy "Project URL" and "anon public" key

### 2.5 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Your site will be live at: `https://your-project.vercel.app`

---

## Step 3: Deploy Backend Server

**Important:** Vercel is for frontend. Backend needs separate hosting.

### Option A: Railway (Recommended - Easiest)

1. **Go to:** https://railway.app
2. **Sign up** with GitHub
3. **Click:** "New Project"
4. **Select:** "Deploy from GitHub repo"
5. **Choose:** Your `campus-guardian-sos` repository
6. **Configure:**
   - **Root Directory:** `server/`
   - **Start Command:** `node sms-service.mjs`
   - **Environment:** Node.js

7. **Add Environment Variables:**
   ```
   PORT=3001
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

8. **Deploy** - Railway will give you a URL like: `https://your-app.railway.app`

9. **Update Vercel Environment Variable:**
   - Go back to Vercel
   - Settings → Environment Variables
   - Update `VITE_API_URL` to your Railway URL
   - Redeploy

### Option B: Render

1. Go to: https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name:** `campus-guardian-backend`
   - **Root Directory:** `server`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node sms-service.mjs`
6. Add environment variables (same as Railway)
7. Deploy

---

## Step 4: Update CORS in Backend

Update `server/sms-service.mjs` to allow your Vercel domain:

```javascript
// Around line 20-30, update CORS:
const allowedOrigins = [
  'https://your-project.vercel.app',  // Your Vercel URL
  'https://your-project.vercel.app',   // With www if you add it
  'http://localhost:8080',              // For local dev
  'http://localhost:3000'               // Alternative local
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**Then commit and push:**
```powershell
git add server/sms-service.mjs
git commit -m "Update CORS for Vercel deployment"
git push
```

Railway/Render will auto-redeploy.

---

## Step 5: Update Supabase CORS

1. Go to your Supabase project
2. Settings → API
3. Add your Vercel URL to allowed origins:
   ```
   https://your-project.vercel.app
   ```

---

## Step 6: Test Your Deployment

1. **Frontend:** Visit `https://your-project.vercel.app`
2. **Test Features:**
   - ✅ Login/Registration
   - ✅ SOS Alert
   - ✅ Location tracking
   - ✅ Media upload
   - ✅ Admin dashboard

3. **Check Browser Console** for any errors
4. **Check Network Tab** - API calls should go to your backend URL

---

## Step 7: Custom Domain (Optional)

1. In Vercel dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `campusguardian.com`)
3. Follow DNS configuration instructions
4. SSL certificate is automatic

---

## 🔧 Troubleshooting

### Build Fails on Vercel
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build` locally first

### API Calls Fail (CORS Error)
- Verify backend CORS includes your Vercel URL
- Check `VITE_API_URL` environment variable
- Ensure backend is deployed and running

### Environment Variables Not Working
- Variables must start with `VITE_` for Vite
- Redeploy after adding variables
- Check variable names match exactly

### Backend Not Responding
- Check Railway/Render logs
- Verify environment variables are set
- Test backend health endpoint: `https://your-backend.railway.app/api/health`

---

## 📝 Quick Reference

**Frontend (Vercel):**
- URL: `https://your-project.vercel.app`
- Framework: Vite
- Build: `npm run build`
- Output: `dist/`

**Backend (Railway/Render):**
- URL: `https://your-backend.railway.app`
- Runtime: Node.js
- Start: `node server/sms-service.mjs`

**Environment Variables Needed:**
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_API_URL
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Frontend deployed to Vercel
- [ ] Environment variables added to Vercel
- [ ] Backend deployed to Railway/Render
- [ ] CORS updated in backend
- [ ] Supabase CORS updated
- [ ] Tested all features
- [ ] Custom domain configured (optional)

---

**Your website will be live at:** `https://your-project.vercel.app`

**Need help?** Share your GitHub repository URL and I can assist with specific steps!

