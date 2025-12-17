# Google OAuth Setup Guide

Follow these steps to enable Google OAuth in your Supabase project.

## Step 1: Get Google OAuth Credentials

### 1.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 1.2 Create or Select a Project
- Click on the project dropdown at the top
- Click **"NEW PROJECT"**
- Enter a name like "SOS Campus Security"
- Click **CREATE**
- Wait for the project to be created (1-2 minutes)

### 1.3 Enable Google+ API
- Search for **"Google+ API"** in the search bar
- Click on **Google+ API**
- Click **ENABLE**

### 1.4 Create OAuth 2.0 Credentials
- Go to **APIs & Services** → **Credentials** (left sidebar)
- Click **+ CREATE CREDENTIALS** → **OAuth client ID**
- If prompted, click **Configure OAuth consent screen**

### 1.5 Configure OAuth Consent Screen
- Choose **External** for User Type
- Click **CREATE**
- Fill in the form:
  - **App name:** SOS Campus Security
  - **User support email:** Your email
  - **Developer contact info:** Your email
- Click **SAVE AND CONTINUE**
- Skip scopes (click **SAVE AND CONTINUE**)
- Skip test users (click **SAVE AND CONTINUE**)
- Review and click **BACK TO DASHBOARD**

### 1.6 Create OAuth Client ID
- Click **+ CREATE CREDENTIALS** → **OAuth client ID** again
- **Application type:** Web application
- **Name:** SOS Campus Security Web Client
- Click **Add URI** under Authorized redirect URIs
- Add this URL:
  ```
  https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback?provider=google
  ```
  (Replace `[YOUR-PROJECT-ID]` with your actual Supabase project ID)
- Click **CREATE**
- Copy the **Client ID** and **Client Secret** shown in the popup

## Step 2: Add Credentials to Supabase

### 2.1 Go to Supabase Dashboard
- Visit: https://app.supabase.com/
- Select your **SOS Campus Security** project

### 2.2 Enable Google OAuth Provider
- Go to **Authentication** (left sidebar)
- Click **Providers**
- Find **Google** in the list
- Click to expand the Google section
- Toggle **Enabled** to **ON** (blue)

### 2.3 Add Your Credentials
- **Client ID:** Paste the Client ID from Google Cloud Console
- **Client Secret:** Paste the Client Secret from Google Cloud Console
- Click **SAVE**

## Step 3: Test Your Setup

### 3.1 Refresh Your App
- Go to: http://localhost:8081
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)

### 3.2 Try Google OAuth
- Click **"Sign in with Google"**
- You should now see the Google consent screen
- Select your account and grant permissions
- You should be logged in and see the dashboard!

## Troubleshooting

### Still getting "Unsupported provider: provider is not enabled"?
1. Make sure the Google toggle in Supabase is **ON** (blue)
2. Verify Client ID and Client Secret are correctly copied (no extra spaces)
3. Check that the redirect URI in Google Cloud Console matches your Supabase project ID
4. Wait 1-2 minutes for Supabase to apply changes
5. Hard refresh your browser (Ctrl+F5)

### Getting "redirect_uri_mismatch" error?
- Make sure the redirect URI in Google Cloud Console exactly matches:
  ```
  https://[YOUR-PROJECT-ID].supabase.co/auth/v1/callback?provider=google
  ```
- Note the `?provider=google` at the end is important!

### Where to find your Supabase Project ID?
- Go to Supabase Dashboard
- Click **Settings** → **General**
- Copy the **Project ID** from the URL or the display

## Alternative: Test with Email + OTP First

If Google OAuth setup is taking time, you can test the app with email registration:
1. Click **"Don't have an account? Sign up"**
2. Create an account with email, name, and register number
3. Check your email for the OTP code
4. Enter the OTP to verify and log in
5. All features work the same way!
