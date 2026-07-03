# OpenPDF

An immersive, warm-neutral PDF reading experience — a single-page React UI built from a
[Figma Make](https://www.figma.com/make/wgXUPCIw9EwovYHntRmDW1/OpenPDF) design.

The interface reimagines a document reader for focused, distraction-free reading:

- **Continuous scroll** through pages with lazy loading and smooth appear animations
- **Reading modes** — Normal (warm paper) and Dark, toggled from the toolbar
- **Table of contents** side panel with active-section tracking
- **Thumbnail rail + page dots** that surface on scroll and hover
- **Cursor-anchored double-click zoom** and a Fit / Full view toggle
- **Hold-and-drag page scrubbing** with a live page preview
- **Figure lightbox** (double-click a figure to expand)
- **Voice-search affordance** (visual stub)
- A warm amber accent on a deep neutral canvas — deliberately no "AI blue"

## Cross-platform

OpenPDF is built as **one web core, wrapped into native apps** for every target — iOS,
Android, Google TV, Apple TV, and Meta Quest — using [Capacitor](https://capacitorjs.com).
The Android build is a single artifact that ships to Google Play, installs on Google TV,
and sideloads onto Meta Quest as a 2D app. (It's also an installable PWA for the browser.)

See **[PLATFORMS.md](PLATFORMS.md)** for the full architecture, per-platform status, and
build steps. Reading is fully operable by keyboard / TV remote / controller (arrow keys,
Page Up/Down, Space, Home/End).

## Tech stack

- [React 18](https://react.dev) + [Vite 6](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com) (`@tailwindcss/vite`)
- [Capacitor](https://capacitorjs.com) — native iOS / Android / Google TV / Quest shells
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) — installable / offline web build
- [lucide-react](https://lucide.dev) icons
- Barlow / Barlow Condensed / DM Mono (Google Fonts, via `index.html`)

The entire experience lives in [`src/app/App.tsx`](src/app/App.tsx) and is driven by inline
styles, so it has no runtime UI-library dependency beyond the icon set.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

## Building

```bash
npm run build        # standard production build -> dist/
npm run preview      # preview the production build
npm run build:single # single self-contained HTML -> dist-single/index.html
```

`build:single` inlines all JS and CSS into one portable `index.html` — handy for hosting the
UI as a standalone, embeddable preview.

## Project structure

```
index.html              # Vite entry
src/
  main.tsx              # React root
  app/App.tsx           # the entire OpenPDF reader UI
  styles/
    index.css           # imports fonts + tailwind + theme
    fonts.css           # Google Fonts
    tailwind.css        # Tailwind v4 entry
    theme.css           # design tokens (colors, radii, typography)
```

---

Generated from a Figma Make design. Document content shown in the reader is placeholder text
for demonstration.
