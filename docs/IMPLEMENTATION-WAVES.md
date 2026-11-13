# Japanese learning: implementation waves · 2026-11-13

This is the implementation ledger for the fresh usability audit. All changes are
on PR #5. Production migrations, deployment, paid-provider activation and native
store releases have not been performed. No scheduled task was created or changed.

## Phase 1 · preserve learning evidence

- Replace repeated localStorage snapshots with account-indexed IndexedDB events.
  Migrate version-1 exports and existing browser data after a committed write;
  remove the 20,000-event reset. Preserve corrupt originals for recovery/export.
- Keep pending uploads separately, acknowledge actual accepted IDs, paginate
  server downloads, and preserve an incremental cursor. Retry on reconnect/focus.
- Save partial quizzes, checked answers, writing mode and accepted stroke index.
  Refresh/deep links resume the exact lesson/task. Separate tabs retain their
  individual task drafts; a settings/sync write cannot replace another draft.
- Keep guest/account data isolated. Import guest progress only after an explicit
  action, preserving the account's chosen preferences.

## Phase 2 · one understandable daily loop

- Main navigation uses the course's evidence for Learn, Practice, Progress and
  Settings. Legacy practice URLs stay available as supporting tools.
- After a saved exercise, one next-step button advances to the remaining task.
  After a completed day, explicitly starting the next lesson updates today's plan.
- Due-review batches can continue beyond the initial 20. A backlog after a break
  offers catch-up before introducing more words. Missed questions have a dedicated
  notebook with question-specific corrections rather than fabricated mastery.
- Timed hiragana/katakana recognition, weekly actual-study reports, streaks and
  optional exam-date pace planning are available. Forecasts use observed recent
  minutes after 14 days; inactivity pauses estimates. Dates are planning ranges,
  not predictions of a JLPT result.
- Reading offers optional furigana for known lesson words, inline definitions,
  Japanese playback and deliberate SRS exposure. Kana units show support for
  additional letters that occur in their example words/passages.

## Phase 3 · reliable Japanese audio and account access

- Registration/recovery are reachable from a fresh browser without onboarding.
  Remove nonfunctional Google sign-in. Recovery uses expiring, hashed, single-use
  tokens and verified provider delivery, with a generic account-existence response.
- Passwords use salted PBKDF2; legacy hashes upgrade on successful login. Reset
  revokes refresh sessions and previous access JWTs through an auth-version check.
- Japanese server TTS requires configured regional credentials; never send an
  empty key or fall back silently to a different language/provider.
- Final Japanese transcript checks remain clearly separate from acoustic scores.
  Configured Azure assessment validates bounded 16 kHz mono PCM audio, selects
  ja-JP, and exposes genuine provider measurements. Silence/errors give no grade.
  No pitch-accent mastery or JLPT score is inferred. Upload is described in the UI;
  recordings are not retained by this application's server.
- Sample/own-recording playback and microphone capture cannot grade one another.
  Speaking supports every word in the current lesson, not just its first word.
- Add 12 original short listening conversations across beginner/N5/N4 foundations,
  with audio-gated choices, kana transcript, Mongolian translation/explanation and
  saved attempts. These use synthetic Japanese audio, not recorded native dialogue.

## Phase 4 · offline delivery and controlled release

- Self-host Latin/Cyrillic and Japanese font subsets with OFL notices/provenance.
  Core navigation uses SVG icons; other used outlines load once. No icon font or
  third-party font CDN is required. The app build uses checked-in display assets;
  `scripts/build-display-assets.py` is an optional maintainer regeneration tool.
- A user-requested offline pack prefetches built app modules, fonts, dictionary and
  course stroke buckets (about 8 MB). Reload and writing work without the network.
  API/auth requests are never cached; speech/provider services still need internet.
- A read-only authenticated `/api/user/course/plan` and Settings JSON export share
  the daily-plan selector. Existing ChatGPT lessons were not automatically coupled
  to private API credentials or changed behind the user's back.
- Migration 0034 adds password recovery/rate limits, auth-version revocation and a
  course-event query index. Health verifies the deployed schema. Web rollout is
  blocked until the required API contract is ready. A manual release workflow
  applies migrations and deploys API before web after recording a backup reference.

## Release procedure

1. Make a private D1 backup and validate recovery against a staging copy.
2. Apply all outstanding migrations through **0034**, in order. 0034 is additive.
   Back up before 0032 as it changes old template publication state.
3. Configure JWT_SECRET as before. For optional server audio/acoustic assessment,
   set SPEECH_KEY and SPEECH_REGION. For recovery, set AUTH_MAIL_API_KEY,
   AUTH_MAIL_FROM (verified sender) and APP_ORIGIN (the trusted HTTPS web origin).
   Use Worker secrets/configuration; do not commit credential values.
4. Deploy API, verify `/health` reports `status: ok, course_schema: 4`; then deploy
   web. The manual `Release Japanese API and web` workflow performs this order.
5. Verify actual email delivery, token revocation, two-device login/sync, and real
   Japanese playback/capture on iPhone Safari and Android Chrome. Check quotas and
   provider availability with genuine reference recordings before broad release.
6. Keep the schema when rolling back application code. Restore exact old content
   publication state only from the private backup. Never delete learner ledgers.
   If rolling back a password-reset-aware API, rotate JWT_SECRET/revoke sessions
   to prevent old pre-reset JWTs being accepted by code without auth-version checks.

## Validation and remaining content work

Automated checks include all migrations in real SQLite, KDF/recovery/session
revocation, provider request/response fixtures, account isolation, >20,000-event
migration/upload, published-content fingerprints, stroke direction/order, full
first-day learning, draft resume, offline reload, audio absence and mobile layout.
See PR checks for the exact final commit and current test totals. Provider fixtures
are not evidence of a live Azure/mail deployment or physical microphone accuracy.

The 98-unit kana + N5/N4 foundation course and its original published IDs remain
intact. These changes do not create a complete N5–N1 teaching corpus. Full N3/N2/N1
units, broader N5/N4 vocabulary, larger native-recorded listening banks, independent
Japanese/Mongolian teacher review and held-out full-length mocks remain editorial
work. Existing recognition/timing exercises do not measure spoken reading fluency.
Native Expo still needs a separate build/device pass; the guided course is web.
