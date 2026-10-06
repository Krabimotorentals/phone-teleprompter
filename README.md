# Voice Teleprompter

Mobile-first, voice-follow teleprompter web app. Paste a script, choose English or Russian speech recognition, and the text scrolls to follow what you say. Works as an installable PWA with offline editor support.

## Features

- Voice-follow scrolling via the Web Speech API (not volume-based scrolling)
- English (`en-US`) and Russian (`ru-RU`) recognition
- Manual auto-scroll fallback
- Mirror text mode for physical teleprompter glass
- Local persistence (script + settings)
- Wake lock and fullscreen during sessions
- No accounts, database, or analytics

## Local setup

Requirements: Node.js 20+

```bash
npm install
npm run dev:fresh
```

`dev:fresh` stops stale Vite servers on ports 5173–5180, then starts dev again (helps when the UI looks outdated).

If the editor still shows an old layout (only a “Mirror text” checkbox, no rotation buttons), clear the PWA cache: Chrome → DevTools → **Application** → **Service Workers** → **Unregister**, then hard-reload the page.

Open the URL shown in the terminal (usually `http://localhost:5173`). Use **HTTPS or localhost** for microphone and speech recognition.

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. Import the project in [Vercel](https://vercel.com/new).
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy.

Alternatively, with the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel
vercel
```

Static hosting is sufficient; no serverless functions are required.

## Install on Android

1. Open the deployed site in **Chrome**.
2. Menu → **Add to Home screen** / **Install app**.
3. Launch from the home screen for standalone, full-screen use.

## Supported browsers

| Feature | Chrome (Android/Desktop) | Edge | Safari (iOS/macOS) | Firefox |
|--------|---------------------------|------|--------------------|---------|
| Speech recognition | Yes (Google) | Yes | Limited / different API | No |
| PWA install | Android: yes | Yes | iOS: Add to Home Screen | Limited |
| Wake Lock | Chrome, Edge | Edge | iOS 16.4+ (partial) | No |

**Recommended:** Chrome on Android for voice-follow mode.

Speech recognition typically sends audio to the browser vendor’s cloud service (e.g. Google for Chrome). This app does not record or store audio; it only uses recognition results to find your place in the script.

## Limitations

- **Firefox** does not implement `SpeechRecognition`; use manual scroll mode.
- **Safari** speech support varies; test on your device or use manual mode.
- Recognition quality depends on network, microphone, and language.
- Very long scripts may scroll less smoothly on low-end devices.
- Mirror mode only flips text horizontally (CSS); hardware glass setup is up to you.

## Project structure

```
src/
  components/     UI (Editor, Teleprompter, settings)
  matching/       Script tokenization and fuzzy forward matching
  speech/         Web Speech API wrapper
  scroll/         Smooth scroll + manual scroller
  lib/            Types and localStorage
  i18n/           UI strings (English; Russian UI ready to add)
  hooks/          Wake lock, fullscreen
```

## Privacy

All script and settings data stay in your browser (`localStorage`). Microphone access is used only for live speech recognition during an active session. No analytics or third-party tracking are included.

## License

MIT
