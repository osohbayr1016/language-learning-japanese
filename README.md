# Nihongo — Монгол хэлээр япон хэл

Independent Japanese learning application. Web (Vite + React), shared Expo
practice screens, and a Hono API on Cloudflare Workers with dedicated D1/R2.
No runtime dependency on the Chinese learning repository or Mandarin stroke data.

## Start and verify

Node 22.16+ (Node 22 LTS in CI). The root `package-lock.json` is canonical for
web/API development and validation. Native Expo development uses the optional
pnpm workspace; it has its own dependencies. Run
`pnpm --config.package-manager-strict=false --config.manage-package-manager-versions=false install --frozen-lockfile` for that
workspace; its lockfile is also reconciled with the manifests.

```sh
npm ci
npm run dev                  # http://localhost:5173/course
npm run typecheck
npm run api:typecheck
npm test
npm run check:isolation
npm run build
npx playwright install chromium
npm run test:e2e
```

The root URL and primary learning tab open `/course`. It works without an
account or API connection. It stores progress in the
current browser; export it before clearing browser data or changing devices.
After signing in, settings can explicitly merge guest progress into that account.
The account's course events then sync to D1; failed writes remain local and retry
on reconnect or with the sync control. Account progress is kept separate.

## Learning product

- 13 hiragana and 13 katakana units: all 46 base kana in each script, voiced
  sounds, combinations, small っ and long vowels; a 46-question optional hiragana
  recognition check lets returning learners start at katakana.
- 40 original N5 and 32 N4 foundation lessons: 486 vocabulary records
  (416 distinct Japanese spelling/reading pairs across all 98 units), original
  passages, optional kana reading support, Mongolian grammar explanations,
  comprehension questions and Japanese writing practice.
- Level progress separates completed lessons, unique words introduced,
  ordered handwriting and optional listening. Recognition placement stays
  separate from these counts. Course stages collapse to keep the next step visible; the word library has level
  filters, search and 24-card pages.
- Daily plan (20 minutes by default): new words, reading, writing and a checkpoint;
  listening and transcript-based speaking are optional. A daily lesson stays
  stable across refreshes. New lessons require the four core tasks to pass.
- Spaced repetition after exposure, visible due reviews, configurable study time,
  learning days/week, timezone and JLPT target; versioned progress export/import.
- 198 beginner kanji with Mongolian meanings and representative on/kun readings.
- Supplementary KANJIDIC dictionary: 13,108 characters, including all 2,136 jōyō
  kanji, Japanese readings and English meanings. Loaded only when opened.
- Self-hosted KanjiVG stroke animation and direction/order-sensitive tracing for
  6,798 characters; all 2,136 jōyō kanji have stroke paths in this snapshot.
- JLPT N5–N1 official section ranges and pass thresholds. Practice scores are
  proportional scores, not official IRT scaled scores. Study-date ranges are
  transparent planning assumptions updated by active study time and frequency.

This is a complete **foundation learning loop**, not a complete N5–N1 curriculum.
N3–N1 course content, broader N5/N4 coverage and independently reviewed
full-length mock exams remain content work. Completing these 98 units does not
certify a JLPT level. The new 36-question N5 foundation checkpoint cannot unlock
N4 by itself. See [release notes](docs/INDEPENDENT-JAPANESE-COURSE.md).

## Speech and audio

Browser recognition and native recognition use `ja-JP`. Only final transcripts
are graded; permission denial, network errors and interim guesses are not grades.
Short words require an exact match; longer targets use a stricter threshold.
Recognition checks the words transcribed, **not phoneme accuracy or pitch accent**.
Transcript practice can use the browser provider. Optional server Japanese TTS
and acoustic assessment require SPEECH_KEY and SPEECH_REGION. The browser's speech provider may process
microphone audio remotely. This application does not save raw recordings.
When no Japanese voice is installed, course playback uses the dedicated Japanese
API’s cached Japanese TTS. Browser support varies; unavailable audio/recognition
have explicit recovery messages. Listening answers unlock only after playback
starts. Real microphone/device QA is
still required before release.

## API and deployment

Dedicated resources are configured in `apps/api/wrangler.toml` (`nihongo-mn-db`,
`nihongo-mn-media`, `nihongo-mn-api`). Never point this app at another course's DB.
For local API use, create `apps/api/.dev.vars` with a local `JWT_SECRET`.

```sh
npm run api:migrate          # new local D1, all migrations in order
npm run api:dev
```

For production, back up D1 and apply outstanding migrations **before** API and web
rollout. This change adds `0031` (course events/settings), `0032` (JLPT score
sections and old-template quarantine), and `0033` (original foundation checkpoint).
Migration `0034` adds account recovery, rate limits and session revocation.
It does not automatically deploy or mutate the live database.

Web deployment uses `npm run deploy`. Production deployment is **manual only**: merging into main never deploys the
API, changes D1, or updates the website. GitHub Actions quality checks still run
on pull requests and main. An explicit manual release workflow checks API schema
readiness, applies migrations and deploys the API before the web. Native
Expo builds remain optional and need separate device QA.

## Data credits

Original curriculum text is stored in `packages/curriculum/src/lessons.json` and
`kanji.json`, and their append-only `extension-*.json` companions. Keep
content additions original or appropriately licensed. Published IDs and answer
positions are immutable; compatibility fingerprints protect the original 50 units.
This curriculum's N5/N4 labels are editorial sequencing, not an official JLPT
word list. The organizers do not publish current vocabulary/kanji/grammar lists:
https://www.jlpt.jp/e/faq/. Japan Foundation Irodori's Elementary 2 grammar overview
was consulted for basic usage; passages, questions and Mongolian explanations are
original: https://www.irodori.jpf.go.jp/assets/data/elementary02/pdf/Z_contents_en.pdf.
Independent Japanese/Mongolian teacher review is still required.

- Stroke geometry: KanjiVG, © Ulrich Apel and contributors, CC BY-SA 3.0. Source
  revision and complete notice: `public/stroke-data/LICENSE.txt`.
- Supplementary dictionary: KANJIDIC, © James William Breen and EDRDG, CC BY-SA
  4.0, converted via David Luz Gouveia's kanji-data. See
  `public/dictionary/LICENSE.txt` and `source.json`. Proprietary WaniKani fields
  and SKIP codes are not included.
- Refresh scripts accept local upstream checkouts:
  `python scripts/import-kanjivg.py /path/to/kanjivg` and
  `python scripts/import-kanji-dictionary.py /path/to/kanji-data`.

## Resilient study and optional services

IndexedDB keeps per-account events and unfinished quiz/writing drafts. The course
also includes a mistake notebook, timed kana recognition, 12 short listening
conversations, furigana/inline reading support, catch-up recommendations, weekly
reports and a user-requested offline pack. See
[implementation waves and release configuration](docs/IMPLEMENTATION-WAVES.md).
