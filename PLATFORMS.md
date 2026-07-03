# OpenPDF — Cross-Platform (Native Builds)

Target platforms: **iOS/iPadOS, Android (Google Play), Google TV, Apple TV, and Meta Quest.**

## Architecture: one web core, native shells

OpenPDF is a single React/Vite web app. Every platform ships as a **native app** that
hosts that same `dist/` build in a system web view via [Capacitor](https://capacitorjs.com)
— no per-platform UI rewrite.

```
                    ┌─────────────────────────────┐
                    │   React + Vite web core      │
                    │   (src/app/App.tsx → dist/)  │
                    └──────────────┬──────────────┘
          ┌───────────────┬────────┴────────┬───────────────┐
          ▼               ▼                 ▼               ▼
     Capacitor iOS   Capacitor Android   Capacitor      SwiftUI + WKWebView
      (WKWebView)    (Android WebView)   Android         (tvOS)
          │               │                 │               │
     iOS / iPadOS   Android + Google TV   Meta Quest      Apple TV
                    (one AAB/APK)         (sideload APK)
```

The **Android build is one artifact** that covers three targets: Google Play phones/tablets,
Google TV (leanback), and Meta Quest (which runs Android — the APK sideloads as a 2D app).

> **Why not WebXR?** Per direction, OpenPDF ships as native apps only — no WebXR. On Meta
> Quest that means the native Android APK running as a 2D panel app, not an immersive
> WebXR scene.

## Status by platform

| Platform          | Native shell                       | Status |
|-------------------|------------------------------------|--------|
| Android           | Capacitor Android (AAB/APK)        | ✅ Project generated + debug APK built |
| Google TV         | Same Android APK + leanback        | ✅ Leanback launcher + banner added; D-pad nav works |
| Meta Quest        | Same Android APK (2D panel)        | ✅ Installs via sideload / App Lab |
| iOS / iPadOS      | Capacitor iOS (Xcode project)      | 🟡 Project generated; needs signing team to archive |
| Apple TV (tvOS)   | SwiftUI + WKWebView shell          | ⏳ Scaffold in `tvos/` — see below |

## Build commands

```bash
npm run build            # produce dist/ (the web core all shells load)

# Android / Google TV / Quest
npx cap sync android
cd android && ./gradlew assembleDebug      # -> android/app/build/outputs/apk/debug/app-debug.apk
# release: ./gradlew bundleRelease          # -> .aab for Google Play

# iOS / iPadOS
npx cap sync ios
npm run cap:open:ios     # open in Xcode, set a signing Team, then Archive
```

Convenience scripts in `package.json`: `cap:add:ios`, `cap:add:android`, `cap:sync`,
`cap:open:ios`, `cap:open:android`.

## Per-platform notes

### Android · Google TV · Meta Quest
- One `android/` project. `AndroidManifest.xml` declares `LEANBACK_LAUNCHER` and
  `android.software.leanback` (`required=false`) so the same APK is a phone app, a Google
  TV app, and a Quest 2D app.
- D-pad / remote / controller paging already works (handled in the web core).
- **Quest:** sideload the APK (`adb install`) or publish via the Meta Store / App Lab.
- **Store banner:** a 320×180 TV banner is referenced for the leanback launcher.

### iOS / iPadOS
- `ios/` is a standard Capacitor Xcode project. To ship: open in Xcode, select a
  development Team under *Signing & Capabilities*, then Archive → App Store Connect.

### Apple TV (tvOS)
- Capacitor has no official tvOS target, so tvOS uses a thin **SwiftUI app hosting a
  `WKWebView`** that loads the bundled `dist/`. The Siri Remote's swipe/select maps to the
  same arrow-key / Enter events the web core already handles. (Scaffold pending in `tvos/`.)

### Focus model (TV + Quest)
Paging by remote/controller works today. Making every *control* (toolbar pills, bottom
controls) reachable by D-pad needs focusable elements with visible `:focus-visible` rings
and roving-tabindex spatial navigation — tracked as a follow-up.

## App identity
- **App ID:** `com.openpdf.app` · **Name:** OpenPDF
- **Icons:** `public/icon.svg` + rasterised `icon-192/512/512-maskable/apple-touch-icon`
- **Theme:** `#0d0c0a` background, `#c8a870` amber accent
