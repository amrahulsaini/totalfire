# APK Update Instructions for Admin

1. Upload the new release APK:
   - Use the signed build at: `mobile/build/app/outputs/flutter-apk/app-release.apk`
   - Replace the file at: `public/downloads/totalfire-latest.apk` with your new APK.
   - Also copy it to a versioned backup file, for example: `public/downloads/totalfire-v1.0.3.apk`

2. Update the download link on https://totalfire.in/game if needed:
   - The page should point to the current versioned file, for example: `/downloads/totalfire-v1.0.3.apk`
   - Keep `public/downloads/totalfire-latest.apk` in sync with the same APK.

3. Update the admin page (https://totalfire.in/admin/app-update):
   - Enter the new version code (for this release: `1.0.3`) and release notes.
   - Set the download URL to `https://totalfire.in/downloads/totalfire-v1.0.3.apk`
   - Save/publish the update.

## Summary of what to replace:
- Replace both `public/downloads/totalfire-latest.apk` and `public/downloads/totalfire-v1.0.3.apk` with the same signed APK.
- On the admin page, update the version and download URL to match the new APK.
- Optionally update release notes or changelog.
