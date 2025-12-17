# ⚡ Quick Deploy to Vercel - 5 Minutes

## 🎯 Goal
Deploy your Campus Guardian SOS app to Vercel so it runs publicly instead of localhost.

---

## Step 1: Push to GitHub (2 minutes)

```powershell
cd "H:\backup\another one\sos_app\prompty-web-builder-main"
$env:PATH = "C:\Program Files\Git\bin;$env:PATH"

# If you haven't created a GitHub repo yet:
# 1. Go to https://github.com/new
# 2. Create repository named "campus-guardian-sos"
# 3. Copy the repository URL

# Add remote and push (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Need GitHub token?** https://github.com/settings/tokens → Generate new token (classic) → Select `repo` scope

---

## Step 2: Deploy to Vercel (3 minutes)

### 2.1 Sign Up
1. Go to: **https://vercel.com/signup**
2. Click **"Continue with GitHub"**
3. Authorize Vercel

### 2.2 Import Project
1. Click **"Add New Project"**
2. Find your `campus-guardian-sos` repository
3. Click **"Import"**

### 2.3 Configure
- **Framework:** Vite (auto-detected)
- **Root Directory:** `./`
- **Build Command:** `npm run build` (auto)
- **Output Directory:** `dist` (auto)

### 2.4 Add Environment Variables
Click "Environment Variables" and add:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_API_URL=https://your-backend-url.railway.app
```

**Get Supabase credentials:**
- Supabase Dashboard → Settings → API
- Copy "Project URL" and "anon public" key

### 2.5 Deploy
Click **"Deploy"** → Wait 2-3 minutes

**✅ Your site is live at:** `https://your-project.vercel.app`

---

## Step 3: Deploy Backend (Optional but Recommended)

**For backend, use Railway (easiest):**

1. Go to: **https://railway.app**
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repo
5. Set **Root Directory:** `server/`
6. Set **Start Command:** `node sms-service.mjs`
7. Add environment variables (EMAIL, TWILIO, etc.)
8. Deploy → Get your backend URL
9. Update `VITE_API_URL` in Vercel with Railway URL
10. Redeploy Vercel

---

## ✅ Done!

Your website is now live at: `https://your-project.vercel.app`

**Next Steps:**
- Test all features
- Share the URL
- Set up custom domain (optional)

---

**Need help?** See `DEPLOY_TO_VERCEL.md` for detailed instructions.

