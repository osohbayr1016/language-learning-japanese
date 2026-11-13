# Independent Japanese course — 2026-11-13

The cloned app still had active HSK question import, a Mandarin stroke source,
Chinese schema aliases, and a 200-point exam calculation. Those paths are removed
or replaced with Japanese-only contracts. Database migration history is preserved.

## Implemented

- `/` and the primary Study navigation open `/course` immediately, without a login wall.
- `/course`: public, responsive daily course with an explicit sequence, task
  feedback, Japanese audio where the device supports it, writing animation and
  ordered tracing, due reviews and a visible daily completion state.
- Canonical curriculum under `packages/curriculum`: 26 kana, 40 original N5 and
  32 original N4 foundation units, 486 vocabulary records (416 distinct spelling/
  reading pairs), original passages, Mongolian grammar, comprehension tasks and
  198 kanji entries. Kanji passages offer optional kana support and Japanese audio.
- Stage evidence separates completed core lessons, distinct introduced words,
  traced characters and listening. Placement recognition does not invent writing
  or vocabulary mastery. Dictionary size never counts as taught content.
- Daily kanji opens that character directly; writing shows Mongolian meaning,
  representative readings and a Japanese example beside the stroke tutor.
- Recognition-based placement of all 46 hiragana, requiring 90%; this skips only
  hiragana in the new course. It does not claim writing/fluency or unlock N4.
- Optional speaking checks final `ja-JP` transcripts. Interim hypotheses, mic
  denial and recognition errors do not become learner grades. Short words require
  exact matching. This is not an acoustic pronunciation or pitch assessment.
- Self-hosted KanjiVG geometry for 6,798 characters, including every jōyō kanji;
  gesture matching checks position, coverage, direction, shape and length. The
  next required stroke enforces order. Missing data and fetch failures show a
  retryable message. CORS headers support native WebView access after deployment.
- Supplementary dictionary with 13,108 Japanese characters and all 2,136 jōyō,
  original source metadata/credits, search, pagination and Japanese readings.
  English meanings supplement the 198 Mongolian descriptions. No WaniKani data
  or SKIP codes are included.
- Exposure-driven review queue; successful/failed recalls change future due time.
- Account-scoped local progress, event union/idempotent D1 writes, prerequisite
  validation at the API, explicit guest progress import, versioned export/import,
  visible storage/sync failure recovery and configurable timezone/day boundary.
- Active study timer pauses when hidden or idle. Roadmap ranges use recorded time,
  planned intensity and observed frequency. Hours are broad product assumptions,
  not official JLPT requirements or guaranteed exam dates.
- Official 180-point JLPT section ranges and section minima in practice scoring,
  a separate knowledge section for N3–N1, and a new original 36-question N5
  foundation checkpoint. Results are labeled proportional practice scores.
- Admin uses Japanese JSON instead of foreign exam PDF parsing. Level labels and
  contracts use 1=N5 … 5=N1. All active imports, display primitives and writer
  identifiers use Japanese naming; old Chinese generators/tone components removed.
- Deterministic root npm validation, blocking web/API type checks, content/API/
  geometry regression tests, an isolation guard, and Chromium learner E2E.

## Release order

1. Back up production D1 before applying changes.
2. Apply outstanding migrations, including `0031_japanese_course.sql`,
   `0032_jlpt_scoring.sql`, `0033_japanese_foundation_checkpoint.sql`.
3. `0032` unpublishes old templates with a non-180 max; it retains their history.
   This is intentional: old results must not be silently relabeled as JLPT.
4. Deploy API, then web including the bundled stroke/dictionary data and headers.
5. Check login/sync on two devices, a guest export/import and the first four tasks.
6. Test real Japanese speech and audio on iPhone Safari and Android Chrome before
   a general release. Native Expo distribution requires a separate native build
   and device pass; the new `/course` screen is the web course.

No live Cloudflare migration or deployment is performed by this implementation.
The existing main-push web deployment workflow is preserved; merge/deploy only
when the database/API rollout is ready. New local course study remains usable
without the sync endpoint; it does not claim that local evidence is server-synced.

## Rollback

Application code can be rolled back separately. `0031` and the added columns in
`0032` can remain. The new practice template may be unpublished if needed.
Restoring old template publication flags requires the pre-migration backup.
Do not drop learner progress tables during an application rollback.

## Content boundary and next work

The course teaches the modern base kana, combinations, N5 foundations and a
guided N4 foundation path. These are editorial learning stages, not official JLPT
content inventories or certification. The official JLPT FAQ explains that current
vocabulary/kanji/grammar lists are not published. The 36-question checkpoint
remains a foundation practice, not a full-length mock or a level unlock.

New units cover plain/て/た forms, dates, particles, shopping and schedules, then
explanation, experience, intention, potential, conditions, giving/receiving,
preparation/result states, passive/causative and introductory respectful language.
There are 6 vocabulary records per new lesson and original comprehension tasks.
Kana support can be revealed; it does not replace the Japanese reading target.
Teacher review in Japanese and Mongolian is still needed.

Next content work: broaden N5/N4 words and graded listening, independently review
Mongolian explanations, add held-out full-length mock banks, and author N3/N2/N1
units. Acoustic pronunciation assessment needs a separately validated speech
alignment/scoring service; browser transcription alone cannot supply it.

Sources consulted for scope/basic grammar, without copying curriculum exercises:
- https://www.jlpt.jp/e/faq/
- https://www.irodori.jpf.go.jp/assets/data/elementary02/pdf/Z_contents_en.pdf

## Validation evidence

See the PR checks for the exact commit. The automated suite includes a fresh
SQLite run of every D1 migration, foreign-key/integrity checks, authenticated
course isolation, idempotency, invalid requests and prerequisite rejection,
JLPT section failures despite a high total, kana/dictionary/stroke coverage,
SRS exposure and lapse behavior, timezone boundaries, forecast inputs, and actual
ordered/reversed pointer traces in Chromium. The browser suite also covers the
legacy learner paths, a guest course day, reload, export/import, small screens,
voice absence and microphone denial.

## Curriculum maintenance

Published lesson IDs, word IDs and answer ordering are immutable: stored attempts
reference these records. Add units with new IDs; publish revised exercises under
new versioned IDs rather than changing historical answer keys. Keep earlier units
available when introducing a new course revision. Dictionary refreshes do not
change lesson mastery or inflate taught vocabulary counts.

## Continuation wave: N5 expansion and N4 foundations

The original 50 records and answer ordering are preserved. New N5 units append
after them, followed by N4: returning learners at the old end continue with
`n5-25`. N4 requires completion of all preceding core units, including the new
N5 expansion. Existing exports remain version 1 and do not need a reset or a D1
schema change. Historical task evidence remains interpretable.

Regression coverage includes 50 published-content fingerprints, old-export
continuation, the N4 prerequisite boundary, distinct word evidence, kana reading
support, kanji deep links and absence of a kana sound grid for N4 kanji.
