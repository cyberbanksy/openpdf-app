# OpenPDF — Cross-Platform Strategy

Target platforms: **iOS/iPadOS, Android (Google Play), Google TV, Apple TV, Meta Quest, and OpenXR.**

## Chosen architecture: one web core, many shells

OpenPDF is a single React/Vite web app. Every platform is reached by wrapping or
presenting that same `dist/` build, rather than maintaining separate native codebases.
This maximises reuse of the UI and keeps behaviour identical everywhere.

```
                         ┌─────────────────────────────┐
                         │   React + Vite web core      │
                         │   (src/app/App.tsx, dist/)   │
                         └──────────────┬──────────────┘
             ┌──────────────┬───────────┼───────────┬──────────────┐
             ▼              ▼            ▼           ▼              ▼
        Capacitor       Capacitor    PWA install  WebXR      SwiftUI+WKWebView
        iOS shell     Android shell  (browser)   session        tvOS shell
             │              │            │           │              │
          iOS/iPad   Android + Google  Desktop/    Meta Quest    Apple TV
                      TV (leanback)    Quest Br.   / OpenXR
```

> **Why this over React Native or Unity?** A flat, scroll-based document reader reuses
> ~100% of its logic as web. RN would mean rewriting the UI for marginal native gains;
> Unity would only pay off if we commit to a *true immersive 3D* reading environment
> (see "Immersive XR" below). If that becomes the goal, Unity/Unreal is the path — this
> web core still stands as the 2D/companion experience.

---

## Status by platform

| Platform            | Mechanism                          | Status |
|---------------------|------------------------------------|--------|
| Desktop / any browser | PWA (installable)                | ✅ Working |
| Meta Quest          | PWA in Quest Browser (WebXR-capable) | ✅ Installs & runs (2D); ⏳ "Enter VR" panel pending |
| OpenXR              | via WebXR (Quest Browser / PC WebXR) | ⏳ Pending immersive session |
| iOS / iPadOS        | Capacitor (WKWebView)              | 🟡 Configured; needs `cap add ios` on a Mac w/ Xcode |
| Android             | Capacitor (AAB/APK)                | 🟡 Configured; needs `cap add android` w/ Android Studio |
| Google TV           | Same Android APK + leanback/D-pad  | 🟡 Android shell + ✅ D-pad nav; ⏳ leanback manifest |
| Apple TV (tvOS)     | SwiftUI + WKWebView shell          | ⏳ Not started (no official Capacitor tvOS) |

✅ done · 🟡 groundwork laid · ⏳ planned

---

## What's implemented now (Phase 1)

- **Installable PWA** — `vite-plugin-pwa` generates `manifest.webmanifest`, a service
  worker (offline precache), and maskable icons. This alone makes OpenPDF installable on
  desktop, Android, iOS Safari, and **the Meta Quest Browser**.
- **D-pad / remote / controller navigation** — arrow keys, PageUp/Down, Space, Home/End
  drive page navigation (`App.tsx`). This is the baseline input model for Google TV,
  Apple TV, and Quest controllers.
- **Capacitor configuration** — `capacitor.config.ts` + npm scripts, pointing at `dist/`.
  Ready to generate native iOS/Android projects.

## Next steps by track

### Native mobile (iOS + Android) — Capacitor
On a machine with Xcode and/or Android Studio:
```bash
npm run build
npm run cap:add:ios       # -> ./ios      (needs Xcode + CocoaPods)
npm run cap:add:android   # -> ./android  (needs Android Studio + JDK 17)
npm run cap:sync
npm run cap:open:ios      # archive & upload to App Store Connect
npm run cap:open:android  # build AAB -> Google Play
```
The generated `ios/` and `android/` folders are git-ignored (regenerated per machine).

### Google TV
- The Android AAB already installs on Google TV.
- Add TV support to the generated `android/` manifest: `<category android:name="android.intent.category.LEANBACK_LAUNCHER"/>`, a TV banner asset, and `<uses-feature android:name="android.software.leanback" android:required="false"/>`.
- D-pad page nav already works; remaining: **focus rings + spatial navigation** for the
  toolbar/controls so every control is reachable by remote (see "Focus model").

### Apple TV (tvOS)
- No official Capacitor tvOS platform. Ship a thin **SwiftUI app hosting a `WKWebView`**
  that loads the bundled `dist/` (or a hosted URL), forwarding Siri-Remote swipes/clicks
  to the same keyboard events the web core already handles.

### Meta Quest / OpenXR — immersive panel
- **Today:** installs as a PWA and runs as a flat window in the Quest Browser.
- **Next (2D panel, recommended):** add an "Enter VR" affordance using the **WebXR Device
  API** (`navigator.xr.requestSession('immersive-vr')`). Render the reader onto a curved
  WebGL quad (three.js) floating in space — the reader stays the same DOM, captured to a
  texture, or re-rendered as an `HTMLMesh`. WebXR runs on the device's **OpenXR** runtime,
  so this covers both "Meta Quest" and "OpenXR" from one implementation.
- **Later (true immersive):** a volumetric multi-document environment — this is where a
  native OpenXR engine (Unity/Unreal) would be evaluated as a separate track.

### Focus model (shared by all TV / XR targets)
The current UI uses non-focusable `<div>`s with hover styling. For full remote/controller
operability of *controls* (not just paging), convert interactive elements to focusable
buttons with visible `:focus-visible` rings and add roving-tabindex spatial navigation.

---

## App identity
- **App ID:** `com.openpdf.app`  ·  **Name:** OpenPDF
- **Icons:** `public/icon.svg` + rasterised `icon-192/512/512-maskable/apple-touch-icon`
- **Theme:** `#0d0c0a` background, `#c8a870` amber accent
