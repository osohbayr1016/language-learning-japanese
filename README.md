# Япон хэл сурах — Japanese learning

Mongolian-language app for learning Japanese: kana, kanji, JLPT N5 lessons,
spaced-repetition flashcards, speaking practice with speech recognition, and games.

This repository is **only** the Japanese app. The Chinese (HSK) app lives in the
separate `language-learning` repository; the two no longer share a `main` branch.

| Part | Where | Runs on |
| --- | --- | --- |
| Website | `src/` + `apps/mobile/src` (screens) | Cloudflare Workers, https://nihongo-mn-web.osohoo691016.workers.dev |
| API | `apps/api` | Cloudflare Workers + D1 + R2, https://nihongo-mn-api.osohoo691016.workers.dev |
| Native app | `apps/mobile` | Expo (iOS / Android) |

## Website

```sh
npm ci           # installs exactly what package-lock.json pins
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # production bundle in dist/
npm run deploy   # build + wrangler deploy --env production
```

Pushing to `main` also builds the site in GitHub Actions. The workflow deploys
automatically when the `CLOUDFLARE_API_TOKEN` secret exists in the repo settings;
until then it only builds and prints a warning, and deploys happen with
`npm run deploy` from a machine that is logged in to wrangler.

Speech recognition on the web uses the browser's Web Speech API with `ja-JP`
(Chrome, Edge and Safari). The native app uses `expo-speech-recognition`, also
pinned to `ja-JP`.

## API

```sh
npm run api:dev     # wrangler dev on :8787
npm run api:deploy  # wrangler deploy --env production
```

## Native app

```sh
npm run legacy:mobile   # expo start inside apps/mobile
```
