# Япон хэл сурах — Japanese learning website

A responsive website for learning Japanese, for Mongolian speakers. It is a
website and nothing else: open it in a phone browser or a desktop browser, same
site, same URL.

## Running it

```bash
npm install
npm run dev
```

That is the whole thing. Vite starts in well under a second and opens
<http://localhost:5173>. There is no native toolchain, no simulator, no dev
client to download.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the website locally |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Serve the built `dist/` |
| `npm run typecheck` | Type-check the website |
| `npm run api:dev` | Run the Cloudflare Worker API locally |
| `npm run api:deploy` | Deploy the API |

## Layout

```
index.html          the page
vite.config.ts      the build
src/
  main.tsx          entry point
  app/
    App.tsx         router
    routes.tsx      every URL the site serves
    RootLayout.tsx  providers + who-can-go-where
    TabBar.tsx      the section switcher
  compat/           browser implementations of the old native modules
apps/api/           Hono + D1 backend (Cloudflare Worker)
```

## Where the screens live right now

The screens are still under `apps/mobile/` and are reached through two aliases in
`vite.config.ts`:

```
@src     -> apps/mobile/src
@screens -> apps/mobile/app
```

This is deliberate and temporary. A separate design-system refactor is landing
across those same directories, and moving several hundred files while they are
being edited would split the tree in half. The site runs as a real website today
regardless; when that work finishes, the directories move under `src/` and those
two alias lines get deleted. Nothing else changes.

Still to do after the move:
- fold `apps/api` into `src/server/`
- delete `apps/`, `packages/`, `turbo.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- drop the leftover Expo config (`app.config.ts`, `eas.json`, `.expo/`)

## `src/compat`

The screens were written for React Native. Rather than rewrite 27,000 lines at
once, each native module is mapped to a browser implementation, so the existing
code runs unchanged in a plain browser tab:

| Native | Browser |
| --- | --- |
| `expo-router` | React Router (`(group)` segments stripped from URLs) |
| `expo-av` | `<audio>` / `<video>` |
| `expo-speech` | `speechSynthesis` |
| `expo-speech-recognition` | Web Speech API (already in `lib/audio/speechWeb.ts`) |
| `expo-secure-store` | `localStorage` |
| `expo-haptics` | `navigator.vibrate` |
| `expo-document-picker` | `<input type="file">` |
| `react-native-webview` | `<iframe>` |
| `react-native-svg` | real `<svg>` |
| `react-native-reanimated` | a small requestAnimationFrame tweener |
| `@expo/vector-icons` | Ionicons only, from the glyph map already on disk |
| `react-native` | `react-native-web` |

These are a migration aid, not the destination. As screens are rewritten in
plain HTML and CSS they stop importing `react-native`, and each compat module can
be deleted once nothing imports it.

## Why the site got smaller

The old build was an Expo web export. Measured on the same code:

| | Expo export | Vite |
| --- | --- | --- |
| Initial JS, gzipped | 777.5 KB | 139.2 KB |
| JS files | 1 (every route) | 106 (per route) |
| Icon fonts | 3,981 KB, 19 files | 380.6 KB, 1 file |
| HTML | 2,549 KB, 58 files | 8.4 KB, 1 file |
| Total shipped | ~11 MB | ~1.4 MB |

Two causes. The export had no code splitting, so opening the home page
downloaded all 58 routes including the admin panel. And `@expo/vector-icons`
was imported through its barrel, which pulled in every icon family — the app
uses 48 icons from Ionicons and nothing else.

## Backend

`apps/api` is a Hono app on Cloudflare Workers with a D1 database. Migrations
are in `apps/api/migrations`. It is deployed separately from the site.

Set `VITE_API_URL` to point the site at a different API:

```bash
VITE_API_URL=http://localhost:8787 npm run dev
```
