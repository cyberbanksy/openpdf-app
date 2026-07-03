import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor wraps the built web app (dist/) as native shells:
//   • iOS / iPadOS  -> App Store
//   • Android       -> Google Play  (the same .aab/.apk installs on Google TV,
//                       and can be sideloaded to Meta Quest as a 2D panel app)
// Apple TV (tvOS) is not an official Capacitor target — see PLATFORMS.md for the
// SwiftUI + WKWebView shell approach used there.
//
// Native projects are generated on a machine with Xcode / Android Studio via:
//   npm run build && npx cap add ios && npx cap add android && npx cap sync
const config: CapacitorConfig = {
  appId: 'com.openpdf.app',
  appName: 'OpenPDF',
  webDir: 'dist',
  backgroundColor: '#0d0c0aff',
  ios: {
    contentInset: 'always',
  },
  android: {
    backgroundColor: '#0d0c0aff',
  },
};

export default config;
