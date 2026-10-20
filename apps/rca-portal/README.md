# RCA Portal (Android)

The family app for Royal Crest Academy: the Crest Quest portal with an iPhone-style
native sign-in, and families stay signed in.

- **Sign in:** a native screen with the admission number and the parent's phone
  number. There is no account to create. "Register" and "Demo" open the portal's own
  pages.
- **Stays signed in:** the hub's session token is kept in the app's private storage
  (never the phone-number password). Each launch opens straight into the portal
  (`/portal/?embed=app#session=…`).
- **In sync:** the portal tells the app when someone signs in or out, and when the
  session expires (`rc-session`, `rc-signed-out`, `rc-portal-ready` through
  `window.AndroidBridge`). The portal pulls changes from the hub's `/api/v1/sync`.
- **Offline:** there's a native "You're offline" screen with Try again, and cached
  pages load when there's no network.
- **Links:** calls, WhatsApp and email open outside the app. Deep links like
  `royalcrest://portal/fees` open a page directly.

Addresses: `PORTAL_URL` and `HUB_URL` in `app/build.gradle.kts`.

## Build
```
cp keystore.properties.example keystore.properties   # point it at royalcrest-release.jks (never commit either)
./gradlew assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../../downloads/rca-portal.apk
```
Raise `versionCode` for every new APK so phones accept it as an update.
The published APK is `/downloads/rca-portal.apk` on the website, offered by the portal's
"Get the app" popup.
