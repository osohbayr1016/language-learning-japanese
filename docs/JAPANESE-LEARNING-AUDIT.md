# Japanese Learning Product Audit — 2026-10-04

## Objective

Turn this repository into a Japanese-learning product where a complete beginner can open the product, understand what to do next, study in a sensible order, retain what they learned, and progress toward JLPT without being exposed to broken routes, fake progress, Chinese/HSK leftovers, or dead-end practice modes.

The product should be **Mongolian-first**, Japanese-correct, usable on web and native mobile, and safe to maintain as the curriculum grows.

## Current architecture

- Website: Vite + React + React Router at the repository root.
- Shared learning UI: the web build reuses screens under `apps/mobile` through compatibility aliases.
- Native app: Expo under `apps/mobile`.
- API: Hono on Cloudflare Workers under `apps/api`.
- Persistence: Cloudflare D1, with R2 for storage.
- Existing learning systems: JLPT chapters/lessons, kana, kanji, grammar, SRS flashcards, writing, speaking, mock exams, games, AI reading, streaks, XP, insights, admin content tooling.

This is already a substantial application. The main problem is coherence and correctness, not a lack of random features.

## P0 findings — correctness and trust

### 1. Daily XP was mathematically wrong

The home page calculated “today” as `total_xp % daily_goal`. Lifetime XP is not daily XP, so progress could reset or display misleading numbers.

**Implemented on `feat/japanese-learning-foundation`:**
- Added `user_daily_activity.xp_earned`.
- XP persistence now updates lifetime XP and today’s XP.
- `/api/user/dashboard` returns `today_xp`.
- Home uses the real daily value.

### 2. The Study page was a toolbox instead of a learning journey

The repository already contained `StudyHero` and `StudyModeGrid`, but `StudyHubScreen` did not render them. Learners saw kana/kanji/games, AI reading, and casual vocabulary without a strong next action.

**Implemented:**
- Review due SRS items first.
- If reviews are clear, recommend the next real unlocked JLPT lesson.
- Show a visible JLPT journey/progress card.
- Restore structured practice modes.
- Keep kana/kanji/games and AI reading as supporting tools, not the primary path.

### 3. Home could send users into an empty flashcard session

When nothing was due, the main card still opened flashcards.

**Implemented:** when the due queue is empty, the CTA now opens the guided Study page.

### 4. Chinese/HSK migration residue remains

Examples found during audit:
- `Hsk1JourneySummaryCard.tsx`
- `hsk1ChapterPick.ts`
- legacy aliases in `hskGate.ts`
- `gen_hsk1*.py`
- `hsk2*` exam import helpers
- `PinyinToggleWeb.tsx`
- `AuthContext` still stores `chinese_level`
- admin route/key names still contain `hsk1`
- `apps/mobile/src/lib/content/hsk1TextbookPdf.ts` pointed to a real **Chinese HSK 1 textbook**. The constant had no indexed references and has now been deleted from this branch.

Some legacy names may need temporary compatibility, but **no Chinese learning content or HSK terminology may be visible to Japanese learners**.

### 5. Type correctness was not a deployment gate

Vite can build while TypeScript errors exist. The active mobile type file referenced `JlptLevel` without declaring/importing it.

**Implemented:**
- Canonical JLPT level declaration added.
- New PR workflow runs website TypeScript/build validation using the same `npm ci` path as production deploys, plus a separate API TypeScript job.

### 6. TypeScript and production build are green on the final branch head

The initial audit exposed hundreds of web/mobile type errors, mostly from incomplete React Native/Expo compatibility typing plus stale migration names. Those blockers were repaired without globally weakening strictness or declaring the application as `any`.

Final CI on branch head `c290076947e06646e1e03fbf9715841092dc6eb8` verified:
- web TypeScript audit: green
- mobile TypeScript audit: green
- API TypeScript: green
- production Vite build: green
- production artifact sanity: green
- JavaScript chunk budget (largest raw chunk <= 600 KB): green

Type correctness is now an enforced part of the PR quality workflow.

### 6. Package-manager lockfiles disagree

`package-lock.json` matches the current root `package.json` and is already used by the production deploy workflow. `pnpm-lock.yaml` is stale and rejects `--frozen-lockfile` because several root dependencies were added after it was generated.

This PR does **not** hand-edit a generated lockfile. API CI temporarily installs the workspace with `pnpm install --no-frozen-lockfile` so API type errors are still caught. A dedicated package-manager cleanup should choose/reconcile the canonical workspace install and regenerate the lockfile with the real package manager.

## P0 work still required before production deployment

1. Apply the D1 migrations in order in staging/production before deploying API code:
   - `0027_daily_xp.sql`
   - `0028_learning_preferences.sql`
   - `0029_lesson_completion_idempotency.sql`
   - `0030_pitch_skill.sql`
2. Verify those migrations against a production-like D1 backup/snapshot before the live deploy.
3. Keep the deleted Chinese HSK textbook/content out of the product; only approved/licensed Japanese material may be added.
4. Perform a final manual device pass for Safari/iPhone and Android Chrome/native Expo before a mobile-store release. Chromium E2E covers the web critical path but does not replace physical-device audio/microphone QA.
5. Reconcile the stale `pnpm-lock.yaml` with the chosen canonical package-manager workflow; CI intentionally still uses `pnpm install --no-frozen-lockfile` for the workspace job.

The previously listed Home/Study error-state audit, `ja-JP` speech checks, Chinese-content validation, and critical browser smoke tests are implemented in this branch.

## P1 — make the product teach, not only provide tools

### A. Curriculum contract

Every learner should have one primary course path:

`Kana foundation -> N5 vocabulary/grammar/listening/reading/speaking -> N5 checkpoint -> N4 -> N3 -> N2 -> N1`

Each lesson must define:
- objective
- prerequisite
- new vocabulary limit
- grammar target
- examples
- listening component where relevant
- active recall exercise
- completion/mastery rule
- SRS handoff
- next lesson

Do not unlock a higher level based only on “clicked complete.” Mastery gates should be based on meaningful evidence such as lesson accuracy plus checkpoint/mock performance.

### B. Placement

**Implemented:** setup keeps self-selection and offers experienced N4–N1 learners an optional 8-question placement check. The result is persisted cross-device.

Placement is advisory: a result above N5 sends the learner to the N5 checkpoint/mock first. It cannot bypass the existing N5 mastery gate and therefore cannot directly unlock N4+ content.

A true beginner selecting “none” is routed to kana/foundation.

### C. Personalization

The setup already records learning reason and JLPT level. Use these inputs:
- travel -> practical phrases/listening emphasis
- career/university -> reading/formal language emphasis
- culture/fun -> balanced path with media reinforcement

Personalization must change recommendations, not only store metadata.

### D. SRS loop

The daily product loop should be:

1. due reviews
2. current lesson
3. weak-skill practice
4. optional exploration
5. visible completion for the day

New vocabulary should enter SRS deliberately after lesson exposure. Avoid dumping unseen words into flashcards.

### E. Explain Japanese naturally to Mongolian learners

Content quality rules:
- natural Mongolian explanation, not word-for-word machine translation
- Japanese script + kana reading where needed
- romaji is a temporary aid, not the default forever
- explain particles and grammar using short contrastive examples
- label formal/casual speech and common usage
- never teach an unnatural sentence merely because it is grammatically possible

## P1 engineering

- Rename active HSK/Chinese code paths to JLPT/Japanese names with migrations/aliases where backward compatibility is required.
- Make a single study-plan selector/service rather than duplicating recommendation logic across screens.
- Add an API endpoint for the learner’s next recommended action so web/native cannot diverge.
- Persist daily goal server-side if cross-device behavior is desired.
- Add structured content validation in admin before publishing lessons.
- Add observability for API failures and broken content references.
- Remove dead files/routes after confirming they are unused.

## P2 quality

- Keyboard and screen-reader audit.
- Mobile touch-target and small-screen audit.
- Offline/read-only fallback for downloaded lesson content.
- Performance budgets for route chunks and API latency.
- Content provenance/license metadata.
- Analytics for onboarding completion, lesson starts/completions, review completion, 1/7/30-day retention.
- Error reporting with route, API endpoint, status, and sanitized context.
- Backup/export strategy for D1 curriculum and learner progress.

## Minimum test matrix

### New learner
- first visit
- onboarding
- level = none
- account creation
- first recommended action is understandable
- complete first lesson
- XP/streak/progress update
- newly learned vocabulary enters review at the intended time

### Returning learner
- has due cards -> review is primary CTA
- no due cards -> next lesson is primary CTA
- daily XP is exactly today’s earned XP
- progress survives reload/device session

### Advanced learner
- self-select N4/N3/N2/N1
- placement behavior is deterministic
- locked levels cannot be bypassed through deep links
- checkpoint pass unlocks correctly

### Failure cases
- API offline
- empty curriculum
- malformed lesson
- missing audio
- microphone denied
- unsupported speech recognition
- expired auth
- slow network
- duplicate submit
- reload during lesson

### Platforms
- Chrome desktop
- Safari desktop
- iPhone Safari
- Android Chrome
- native iOS/Android when shipping Expo builds

## Definition of done

Do not call the product “complete” because the UI looks polished.

A phase is done only when:
- TypeScript checks pass for web and API.
- Production build passes.
- DB migrations are applied and verified.
- Critical learner-path smoke tests pass.
- No learner-facing HSK/Chinese leftovers exist.
- No primary CTA opens an empty/dead screen.
- Every async screen has loading, error, empty, and recovery behavior.
- Course progress is real data, never fabricated.
- Japanese content has been reviewed for linguistic correctness.
- The PR contains a migration/deploy note and rollback considerations.


## Final Session 10 verification

Verified branch head before this documentation update: `c290076947e06646e1e03fbf9715841092dc6eb8`.

### Automated quality gates

- Web production build: PASS
- Web TypeScript audit: PASS
- API TypeScript: PASS
- API domain tests: PASS
- Mobile pure-domain tests: PASS
- Mobile TypeScript audit: PASS
- Production artifact sanity: PASS
- Web JavaScript chunk budget: PASS
- Critical Chromium learner E2E: **10/10 PASS**

The browser suite covers:
- zero/beginner learner recommendation
- returning N5 learner with due review
- advanced learner with N4 path after the gate
- temporary API failure + retry
- expired authentication
- hard refresh inside a lesson route
- 360 px mobile viewport overflow
- keyboard-only kana checkpoint
- missing pronunciation audio
- microphone permission denial

### Integrity/security audit

- No credential/private-key pattern was found in added PR lines.
- No critical-path TODO/FIXME placeholder was found.
- Learner-facing Study progress distinguishes authenticated progress from public/degraded catalog data.
- API errors expose request correlation IDs without leaking production stack traces.
- Auth refresh uses single-flight refresh and clears invalid sessions deterministically.
- Missing web audio fails visibly rather than hanging.
- Active flashcards use Japanese/Romaji display primitives instead of Mandarin tone-color rendering.
- Legacy HSK/pinyin/tones names that remain are limited to compatibility, migration, rejection, or historical documentation paths; they are not presented as Japanese learner content.

### Deployment order

1. Back up/snapshot production D1.
2. Apply migrations `0027` -> `0028` -> `0029` -> `0030`.
3. Verify schema/data, especially daily XP, preferences, completion-event ledger, and migrated `pitch` skill rows.
4. Deploy API Worker.
5. Run API health/auth/study smoke checks.
6. Deploy web.
7. Run the critical learner smoke path on the deployed environment.
8. Only then consider marking the PR ready/merging.

### Rollback/recovery

- `0027`, `0028`, and `0029` are additive and may remain if application code is rolled back.
- `0030` transforms legacy `tones` skill rows into `pitch` and deletes the old rows. Preserve a D1 backup before applying it; restoring those exact legacy rows requires the backup.
- Web/API application code can be rolled back independently after schema deployment because the new additive schema is backward-tolerant for the previous application.
- Do not automatically merge this PR. It remains draft until the repository owner applies/validates production migrations and completes deployment review.

### Screenshot note

UI changes are exercised by browser E2E, but no success-state screenshot artifact is attached by the current connector-only workflow. Add review screenshots before marking the PR ready if your review process requires visual evidence.
