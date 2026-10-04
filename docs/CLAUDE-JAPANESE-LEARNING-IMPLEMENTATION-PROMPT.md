# Production Implementation Prompt — Japanese Learning Platform

You are the principal engineer, learning-product architect, Japanese-learning UX designer, and final code reviewer for this repository:

`osohbayr1016/language-learning-japanese`

Start by reading:
1. `docs/JAPANESE-LEARNING-AUDIT.md`
2. the latest branch diff
3. `README.md`
4. root `package.json`
5. `src/app/routes.tsx`
6. `src/app/RootLayout.tsx`
7. `apps/mobile/src/features/study/StudyHubScreen.tsx`
8. `apps/mobile/src/features/lessons/*`
9. `apps/mobile/src/context/AuthContext.tsx`
10. `apps/mobile/src/context/GamificationContext.tsx`
11. `apps/api/src/routes/lessons.ts`
12. `apps/api/src/routes/user.ts`
13. all D1 migrations
14. `.github/workflows/quality.yml`

Do not make assumptions from the repo name or README alone. Trace the real routes, API calls, D1 schema, shared web/native screens, and current branch behavior.

## Mission

Make this a Japanese-learning product that a real learner can use from zero Japanese through a structured JLPT path.

The result must feel like one coherent teacher, not a collection of unrelated flashcards, games, and screens.

The primary learner experience must answer these questions immediately:

- What should I do today?
- What should I learn next?
- Why am I doing this exercise?
- What did I learn?
- What do I need to review?
- How close am I to my next JLPT milestone?

Do not optimize for feature count. Optimize for correctness, clarity, retention, progression, and reliability.

## Repository architecture you must preserve

- Web application: Vite + React + React Router at repository root.
- Web reuses much of `apps/mobile` through aliases and compatibility modules.
- Native mobile: Expo / React Native under `apps/mobile`.
- API: Hono under `apps/api`.
- Runtime: Cloudflare Workers.
- DB: Cloudflare D1.
- Media/storage: R2.
- Shared packages: `packages/*`.

Any change to a shared mobile screen can affect both web and native. Verify both assumptions before refactoring.

Do not create a second competing web application or duplicate feature tree.

## Non-negotiable language rules

This is a Japanese-learning product.

### Never expose to learners

- HSK labels
- Chinese curriculum
- pinyin terminology
- Mandarin-specific speech settings
- Chinese textbook content
- Chinese exam content masquerading as JLPT
- fake Japanese examples generated from Chinese source material

Legacy internal names may temporarily remain only when required for migration compatibility, but they must be isolated and documented.

### Japanese content rules

- Speech recognition and TTS must use Japanese / `ja-JP` where applicable.
- Use kanji + kana naturally.
- Use romaji only as a beginner aid.
- Make romaji progressively optional/hidden as learner ability improves.
- Explain grammar naturally in Mongolian.
- Mark formal/casual usage where meaningful.
- Prefer common natural Japanese over technically grammatical but unnatural sentences.
- Do not invent JLPT claims that are not grounded in the curriculum/content source.

## Product model

The primary course should be:

`Kana foundation -> JLPT N5 -> N4 -> N3 -> N2 -> N1`

Each level should combine:
- vocabulary
- grammar
- reading
- listening
- pronunciation/speaking
- kanji
- active recall
- spaced repetition
- checkpoint/mock assessment

Games, AI reading, cartoons/media, writing tools, and exploration are reinforcement. They must not replace the main course path.

## Daily learning loop

The default recommendation order should be:

1. due SRS reviews
2. current/next course lesson
3. weak-skill practice
4. optional exploration/media/games
5. end-of-day completion feedback

Do not send a learner to an empty mode.

If a queue is empty, give a useful next action.

Do not show made-up percentages or placeholder progress.

## Beginner experience

A learner choosing “no Japanese yet” must receive a deterministic beginner path.

The first sessions should establish:
- hiragana recognition
- hiragana sound mapping
- core greetings/phrases
- very small vocabulary load
- basic sentence order and particles
- listening and pronunciation exposure

Do not dump a beginner directly into a random N5 word list.

Add an optional placement path for learners who already know Japanese.

Self-selected level can be an input, not unquestioned truth.

## Personalization

Current setup captures:
- JLPT/self level
- learning reason

Use this data for recommendation behavior.

Examples:
- university: reading, grammar, academic/formal usage
- career: business/formal language and reading
- travel: listening and practical conversation
- culture/fun: balanced core path with media reinforcement

The main JLPT foundation must remain intact. Personalization changes emphasis, not correctness.

## SRS contract

New words should enter SRS after meaningful first exposure.

Do not show unseen vocabulary as if it were review.

Every review submission must:
- be idempotent or safely retryable
- update the right word progress
- update streak/activity exactly once
- award XP exactly once
- schedule the next review correctly
- survive refresh/navigation

Daily XP and lifetime XP are different concepts. Never derive “today XP” from lifetime XP with modulo math.

## Course progression

Higher levels must not unlock from a superficial click.

Define mastery evidence such as:
- required lesson completion
- minimum lesson accuracy
- checkpoint/mock pass
- or another explicit documented rule

Deep links must not bypass a locked curriculum gate.

Keep web and API gate logic consistent; API is authoritative.

## Guest vs account behavior

Audit the current route guard and public lesson API.

Decide and implement a coherent policy:

Preferred product behavior:
- a visitor can preview/start enough learning to understand product value
- account creation is required when persistent cross-device progress is needed

If guest learning is implemented:
- do not create two separate lesson engines
- reuse the public catalog/public lesson endpoints
- clearly explain what is saved locally vs server-side
- provide a safe upgrade path into an account

If guest learning is intentionally not implemented in this phase, document that decision rather than pretending anonymous learning works.

## Content quality and publishing

Admin-published learning content must be validated before publish.

Validate at minimum:
- title
- JLPT level
- lesson order
- Japanese text
- Mongolian explanation
- vocabulary references
- duplicate vocabulary
- missing/invalid audio
- invalid exercises
- answer keys
- empty lesson
- broken media URLs
- unsupported content type

A malformed lesson should fail publication with actionable errors rather than fail in front of learners.

Add source/provenance metadata where copyrighted or external learning content is used.

Never ship an external textbook URL merely because it is available online. Confirm permission/license and product appropriateness.

## Error-state contract

Every important async screen must have:
- loading state
- success state
- empty state
- error state
- retry/recovery path

Never swallow an important error and render misleading empty progress.

Do not show a generic “something went wrong” when the app can explain:
- login expired
- offline
- lesson missing
- content not published
- level locked
- microphone denied
- speech API unsupported
- server unavailable

## Accessibility

Web:
- semantic navigation
- keyboard reachable controls
- visible focus
- correct labels
- route announcement/focus behavior
- no click-only inaccessible controls

Mobile:
- minimum usable touch targets
- accessibilityLabel/accessibilityHint for icon-only actions
- no essential information conveyed by color alone

Japanese glyphs must not be clipped at larger text sizes.

## Performance

Do not undo route-level code splitting.

Avoid duplicate API calls from sibling components.

Prefer one source of truth for the learner’s recommended next action.

Longer term, move recommendation selection toward an API/domain service so web and native cannot drift.

Avoid loading every lesson/word/media asset when only one screen needs it.

## Security and integrity

- API remains authoritative for protected progress and unlock rules.
- Do not trust client-submitted XP blindly without validating reasonable bounds/context.
- Prevent duplicate completion/reward exploits.
- Keep admin routes protected server-side, not only hidden in UI.
- Validate IDs and JSON payloads.
- Do not leak secrets into client bundles.
- Do not weaken auth to solve UX problems.

## Required cleanup

Systematically locate and classify all remaining:
- `hsk`
- `HSK`
- `chinese`
- `Chinese`
- `mandarin`
- `Mandarin`
- `pinyin`
- `Pinyin`
- `hanzi`
- `Hanzi`
- `zh-CN`

For each occurrence mark it:
- REMOVE — wrong for Japanese
- RENAME — active Japanese behavior with stale Chinese name
- LEGACY — migration/backward compatibility only
- VALID — only if there is a very specific legitimate reason

Then eliminate learner-facing wrong content.

Pay special attention to:
- `apps/mobile/src/lib/content/hsk1TextbookPdf.ts`
- old HSK generation scripts
- HSK admin routes
- HSK exam import helpers
- `AuthContext` storage/state naming
- `PinyinToggleWeb.tsx`
- legacy API helper aliases

Do not mass-rename persisted keys without a migration strategy.

## Testing you must add

There is currently insufficient automated coverage.

Add tests starting with domain behavior, not snapshots.

Minimum coverage:

### Recommendation
- due reviews exist -> review first
- no reviews + unfinished lesson -> next lesson
- no reviews + no lessons -> safe fallback
- locked chapter never chosen

### Daily XP
- first XP event creates today row
- later event increments same date
- lifetime XP remains independent
- next day starts from zero
- duplicate/retried request does not double-award once idempotency is implemented

### Course gate
- N5 incomplete and no passing checkpoint -> N4 blocked
- all required N5 lessons complete -> unlock
- passing N5 mock -> unlock
- deep-link fetch for locked N4 -> 403

### SRS
- rating changes interval correctly
- due queue excludes future cards
- lesson-introduced word honors flashcard eligibility delay

### Routes/smoke
- onboarding
- register/login
- home
- study
- first lesson
- complete lesson
- flashcard
- grammar
- mock exam
- kana
- kanji
- games
- profile

## CI is authoritative

Before claiming a phase is done, all of these must pass:

```bash
npm ci
npm run typecheck
npm run build

# API/workspace validation until pnpm-lock.yaml is regenerated:
pnpm install --no-frozen-lockfile
pnpm --dir apps/api type-check
```

Also run the relevant tests you add.

The repository currently has a stale `pnpm-lock.yaml`. Treat regenerating/reconciling it as package-manager maintenance; do not manually fabricate lockfile entries.

Do not say “production ready” if checks are red.

Do not silence TypeScript with `any` just to pass CI.

## Database changes

For every D1 schema change:
- create a new migration
- never edit an already-applied migration
- update API types/contracts
- document deployment order
- test old-data behavior
- consider rollback/recovery

Do not deploy code that references a new column before the migration is applied.

## Work sequence

Work in this order.

### Session 1 — baseline and contamination audit
- Run quality checks.
- Inventory Chinese/HSK residue.
- Inventory broken/dead routes.
- Inventory fake/static progress.
- Inventory API calls that can fail silently.
- Write findings into the audit document.
- Fix only blockers required to establish a trustworthy baseline.

### Session 2 — learner next-action engine
- Centralize recommendation logic.
- Due review -> next lesson -> weak skill -> exploration.
- Remove empty/dead CTAs.
- Add tests.

### Session 3 — beginner curriculum entry
- Ensure “none” level starts correctly.
- Add kana/foundation course entry.
- Add placement option for experienced learners.
- Ensure setup data actually changes the study plan.

### Session 4 — JLPT progression
- Make N5 path complete/coherent.
- Define mastery gate.
- Make N4+ unlock logic explicit.
- Test deep-link bypass protection.

### Session 5 — SRS and progress integrity
- Audit scheduling.
- Add idempotent reward/completion handling.
- Verify streak/daily XP/lesson stats.
- Add tests.

### Session 6 — Japanese content quality
- Audit Japanese/Mongolian content.
- Remove HSK/Chinese learning material.
- Standardize romaji/kana/kanji display.
- Validate speech locale.
- Add publishing validation.

### Session 7 — reliability and recovery
- Loading/error/empty/retry audit.
- Offline and expired-session behavior.
- Observability.
- API failure handling.

### Session 8 — UX/accessibility/performance
- Mobile-first flow audit.
- Desktop keyboard/a11y audit.
- Remove duplicated requests.
- Performance/bundle checks.

### Session 9 — full learner E2E
Test:
- zero learner
- returning N5 learner
- advanced learner
- failed network
- missing audio
- mic denied
- expired auth
- repeated submission
- page refresh in lesson
- mobile narrow viewport
- desktop keyboard-only

### Session 10 — final production audit
- no TODO placeholders in critical path
- no wrong language residue
- migrations documented
- CI green
- tests green
- no dead CTA
- no fake progress
- security check
- final PR summary

## Coding rules

- Prefer small domain functions over giant screen components.
- Do not duplicate recommendation/business logic between web and native.
- Keep API contracts typed.
- Do not use comments to excuse broken behavior.
- Remove dead code only after verifying references.
- Preserve existing user progress data.
- Backward-compatible migration beats destructive rename.
- Never hard-code fake learner counts, percentages, or completion.
- Avoid a large unrelated visual redesign while fixing core learning correctness.
- Keep Mongolian copy concise and natural.

## Commit discipline

Create meaningful commits by completed concern, for example:
- `fix(progress): track daily xp independently`
- `feat(study): recommend next learner action`
- `fix(curriculum): remove HSK content from Japanese path`
- `test(api): cover JLPT advance gate`

Do not commit generated build output.

## Pull request requirements

PR description must include:
- problem
- root causes
- changed behavior
- migration list
- validation performed
- screenshots where UI changed
- known remaining work
- deployment order
- rollback/recovery note

Do not merge automatically unless explicitly instructed by the repository owner.

## Final standard

The goal is not “all features exist.”

The goal is:

A learner can arrive with zero Japanese, always understand the next action, learn correct Japanese in a coherent order, review at the right time, see truthful progress, recover from failures, and continue toward JLPT without the system contradicting itself.

Continue until the scoped session has a concrete tested deliverable. If you discover a blocker, fix the blocker or document it precisely with file paths, reproduction steps, and the next safe action. Never hide an unresolved correctness issue behind UI polish.
