# Vercel Environment Variables Setup

## Critical Issue
The app shows blank page because **Supabase environment variables are NOT configured on Vercel**.

## Required Steps

### 1. Get Supabase Credentials
- Go to: https://app.supabase.com
- Find your project: `lkxprmsqmtwfouyvoyqx`
- Go to **Settings → API**
- Copy:
  - **Project URL** (VITE_SUPABASE_URL)
  - **Anon Public Key** (VITE_SUPABASE_PUBLISHABLE_KEY)

### 2. Set Variables on Vercel
1. Go to: https://vercel.com/mohammedafridh20234124-hue/sos_app
2. Click **Settings**
3. Click **Environment Variables**
4. Add these variables:

```
VITE_SUPABASE_URL=<YOUR_SUPABASE_URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<YOUR_ANON_KEY>
```

**These MUST be set for Production**

### 3. Redeploy
After setting env vars, Vercel will automatically redeploy.
If not, go to **Deployments** and click **Redeploy** on the latest deployment.

### 4. Expected Result
✅ Landing page loads  
✅ Login button visible  
✅ Can access authentication  

## Troubleshooting
- If still blank: Check browser console (F12) for errors
- Look for "🚀 App starting" log message
- Check Vercel build logs for environment variable warnings
