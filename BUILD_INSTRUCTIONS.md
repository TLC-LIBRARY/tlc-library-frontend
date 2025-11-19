# Android APK Build Instructions

## Prerequisites
You need to have EAS CLI installed and be logged in to your Expo account.

## Step 1: Login to EAS (if not already logged in)
```bash
cd /app/frontend
npx eas-cli login
```
Use your Expo account credentials (tlclibrary account).

## Step 2: Build Android APK with Cache Cleared
Run the following command to build the preview APK:

```bash
npx eas-cli build --platform android --profile preview --clear-cache
```

This will:
- Use Node.js 22.11.0 (as configured in eas.json)
- Build an APK file (not an AAB)
- Clear any cached builds to ensure a fresh build
- Use the production backend URL: https://tlc-library-backend.onrender.com

## Step 3: Monitor Build Progress
After running the command, you'll get:
- A build URL to monitor progress in your browser
- Real-time logs in the terminal

## Step 4: Download APK
Once the build is complete:
- The terminal will show a download link
- Or visit: https://expo.dev/accounts/tlclibrary/projects/contritrack/builds
- Download the APK file

## Configuration Summary
✅ Node.js: 22.11.0
✅ Backend URL: https://tlc-library-backend.onrender.com
✅ Build Type: APK (preview profile)
✅ Package: com.tlclibrary.contritrack
✅ Version: 1.0.0

## Alternative: Build via Expo Dashboard
1. Visit: https://expo.dev
2. Login with tlclibrary account
3. Select "contritrack" project
4. Click "Builds" → "Create a build"
5. Select "Android" → "preview" profile
6. Click "Build"

## Troubleshooting
If you encounter issues:
- Ensure you're logged in: `npx eas-cli whoami`
- Check project configuration: `npx eas-cli build:configure`
- View build logs on Expo dashboard

