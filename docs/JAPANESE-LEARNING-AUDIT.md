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
- `apps/mobile/src/lib/content/hsk1TextbookPdf.ts` points to a real **Chinese HSK 1 textbook**, which must never appear in the Japanese learner journey.

Some legacy names may need temporary compatibility, but **no Chinese learning content or HSK terminology may be visible to Japanese learners**.

### 5. Type correctness was not a deployment gate

Vite can build while TypeScript errors exist. The active mobile type file referenced `JlptLevel` without declaring/importing it.

**Implemented:**
- Canonical JLPT level declaration added.
- New PR workflow runs:
  - workspace install
  - website TypeScript check
  - API TypeScript check
  - production Vite build
  - artifact sanity check

## P0 work still required

1. Run migration `0027_daily_xp.sql` in local/staging before testing this branch.
2. Remove or quarantine the Chinese HSK textbook constant. Replace it only with a licensed/approved Japanese learning source.
3. Audit every route reachable from Home/Study for:
   - route exists
   - loading state
   - empty state
   - network error state
   - retry/back path
4. Verify all Japanese audio/speech recognition uses `ja-JP`.
5. Verify no Chinese characters/content are accidentally treated as Japanese vocabulary except legitimate shared kanji.
6. Add automated smoke tests for the critical learner path.

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

Current setup asks users to self-select a level. Keep self-selection, but add an optional short placement test for non-beginners.

A true beginner selecting “none” must be taken to kana/foundation, not dropped into a random vocabulary mode.

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
