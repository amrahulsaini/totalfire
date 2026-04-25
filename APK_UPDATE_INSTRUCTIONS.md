# APK Update Instructions for Admin

1. Upload the new release APK:
   - Go to your server or hosting panel.
   - Replace the file at: `public/downloads/totalfire-latest.apk` with your new APK.
   - Optionally, upload with a versioned name (e.g., `totalfire-v1.0.3.apk`) for backup/versioning.

2. Update the download link on https://totalfire.in/game if needed:
   - The page should already point to `/downloads/totalfire-latest.apk`.
   - If you use versioned files, update the link to the new version.

3. Update the admin page (https://totalfire.in/admin/app-update):
   - Enter the new version code (e.g., 1.0.3) and release notes.
   - Set the download URL to `/downloads/totalfire-latest.apk` (or the versioned file if you prefer).
   - Save/publish the update.

## Summary of what to replace:
- Replace `public/downloads/totalfire-latest.apk` with your new APK.
- On the admin page, update the version and download URL to match the new APK.
- Optionally update release notes or changelog.
