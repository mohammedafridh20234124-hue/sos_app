# 🚀 Quick GitHub Push Instructions

## Step 1: Create GitHub Repository

1. Go to: **https://github.com/new** (already opened for you)
2. **Repository name:** `campus-guardian-sos`
3. **Description:** "Campus Guardian SOS - Emergency Alert System"
4. **Visibility:** Choose Public or Private
5. **⚠️ IMPORTANT:** Do NOT check:
   - ❌ Add a README file
   - ❌ Add .gitignore  
   - ❌ Choose a license
6. Click **"Create repository"**

## Step 2: Get Your Repository URL

After creating, copy the repository URL. It will look like:
```
https://github.com/YOUR_USERNAME/campus-guardian-sos.git
```

## Step 3: Run Push Command

**Option A: Using the PowerShell Script**
```powershell
cd "H:\backup\another one\sos_app\prompty-web-builder-main"
.\push-to-github.ps1 -GitHubUsername "YOUR_USERNAME" -RepoName "campus-guardian-sos"
```

**Option B: Manual Commands**
```powershell
cd "H:\backup\another one\sos_app\prompty-web-builder-main"
$env:PATH = "C:\Program Files\Git\bin;$env:PATH"

# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/campus-guardian-sos.git
git branch -M main
git push -u origin main
```

## Step 4: Authentication

When prompted for credentials:
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your GitHub password)

### How to Create Personal Access Token:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "Campus Guardian Push"
4. Select scope: **repo** (check the box)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## ✅ Verification

After pushing, visit:
```
https://github.com/YOUR_USERNAME/campus-guardian-sos
```

You should see all your files there!

## 🔄 Future Updates

To push updates later:
```powershell
cd "H:\backup\another one\sos_app\prompty-web-builder-main"
$env:PATH = "C:\Program Files\Git\bin;$env:PATH"
git add .
git commit -m "Your update message"
git push
```




