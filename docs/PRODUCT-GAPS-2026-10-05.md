# Japanese learning product gap audit — 2026-10-05

Audited baseline: `main @ 9e2d167642358b174b5b81cc4f55e841399f7879`.

This file records gaps observed after the Japanese-learning foundation and learner-UX rebuild were merged. It separates verified code gaps from deployment/runtime items that cannot be proven from Git state alone.

## Already solid

- Japanese-first Learn / Practice / Progress / Profile shell.
- Server-authoritative daily XP, learner preferences, placement state, SRS queue, idempotent lesson completion, and JLPT gate logic.
- Central `/api/user/next-action` recommendation endpoint.
- Web, native Expo, Hono/Workers API, D1 and R2 foundations.
- Critical browser E2E for the main learner path.
- Publishing validation that rejects known Chinese/HSK residue in critical lesson fields.

## P0 — production and trust gaps

1. **Production migration state is not verifiable from Git.** Migrations `0027`–`0030` exist, but staging/production D1 must be checked before rollout.
2. **Package-manager drift remains.** Root deploy uses `npm ci`; workspace CI uses pnpm with `--no-frozen-lockfile`. Pick one canonical workflow and regenerate the lockfile.
3. **CI still tolerates TypeScript failures.** The checked-in workflow uses `continue-on-error` for web/mobile type checks. Batch 1 makes these hard gates.
4. **Physical-device QA is still required.** Chromium E2E does not prove iPhone Safari, Android Chrome, native Expo audio/microphone, safe areas, or speech recognition.
5. **No explicit staging-promotion contract.** Add migration verification, smoke tests, rollback decision, and release evidence.

## P0/P1 — learning-product gaps

6. **The default curriculum is far too small.** The seed publishes only five N5 lessons with 22 attached words. N4/N3 are seeded but unpublished; N2/N1 are not seeded there.
7. **No complete enforced curriculum contract.** Every lesson should have objective, prerequisites, target vocabulary/grammar, examples, active recall, listening where relevant, mastery rule, SRS handoff, and next lesson.
8. **Insufficient N5 breadth.** A real N5 course needs much more vocabulary, grammar, reading, listening, kana fluency, sentence production, and checkpoint coverage.
9. **N4/N3/N2/N1 content pipeline is incomplete.** Admin import tools exist, but there is no complete reviewed, licensed, published course for those levels.
10. **Listening comprehension is not a first-class course lane.** Add graded speed, transcripts, comprehension scoring, replay policy, and level coverage.
11. **Grammar progression needs a formal syllabus and prerequisite graph.**
12. **Romaji should fade with mastery** rather than remain a static display preference.
13. **Adaptive planning is still shallow.** Current priority logic is good but does not model concept-level mastery, repeated misconceptions, response-time trends, confidence calibration, or skill-specific forgetting.
14. **Pronunciation coaching is limited by speech recognition quality.** It is not mora/phoneme or pitch-accent coaching.
15. **Writing feedback is practice-oriented.** Add proportion, balance, stroke placement, repeated-error clustering, and progression.
16. **Content provenance/license metadata is missing.** Store source, license/permission, author/reviewer, review date, JLPT rationale, and revision history.
17. **Human linguistic QA is not enforced as a publish gate.**

## P1 — learner experience gaps

18. **No installable/offline-safe web shell.** Batch 1 adds a manifest + service worker that caches only the app/static shell and never API/auth traffic.
19. **No true downloaded lesson packs.** Add versioned lesson/audio downloads.
20. **No offline mutation queue/conflict strategy.** SRS answers and completions need idempotent queued writes plus visible sync state.
21. **No learner-configurable reminder/notification system** for due reviews, streak protection, and study schedule.
22. **Search/discovery is fragmented.** Add a learner-facing Japanese/kana/romaji/Mongolian dictionary search.
23. **Accessibility automation is limited.** Add axe/equivalent, screen-reader regression, contrast, and focus-order gates.
24. **Reduced-motion behavior is not a repository-wide contract.**

## P1 — analytics, reliability, operations

25. **No learning-event analytics pipeline.** Track onboarding, lesson start/complete/abandon, review completion, checkpoint attempts, recommendation exposure/acceptance, and 1/7/30-day retention.
26. **No product experiment / feature-flag framework.**
27. **Error observability is incomplete.** Request IDs exist, but there is no durable aggregation of route, endpoint, build, status, platform, and sanitized context.
28. **No SLOs / latency budgets** for API p95/p99, error rate, recommendation latency, audio latency, or route interaction.
29. **Backup/export automation is missing** for curriculum and learner history.
30. **Migration verification automation is missing.**
31. **Explicit rate-limit / abuse policy is not visible** for auth, AI reading, TTS/audio, and import endpoints.

## P2 — maintainability gaps

32. **Active legacy HSK/Chinese identifiers remain.** Examples include `AdminHsk1LessonsScreen`, `groupLessonTreeByHsk`, `/admin/hsk1-lessons`, `hskGate.ts`, HSK2-named import helpers, and `PinyinToggleWeb`. Batch 1 starts canonical JLPT naming while preserving compatibility aliases.
33. **Compatibility files need an expiry/removal plan.**
34. **Test coverage is concentrated.** Add admin-publishing, import, malformed-content, settings-sync, accessibility, PWA/offline, and deployment smoke tests.
35. **No dependency/security audit gate** is required by CI.
36. **No clear release/version/changelog discipline** linking web, API, native builds, migrations, and rollback points.

## Recommended execution order

1. Make type checks blocking and add an installable/offline-safe web shell. **Started in Batch 1.**
2. Finish Japanese/JLPT canonical naming while preserving compatibility aliases. **Started in Batch 1.**
3. Reconcile package manager + lockfile.
4. Add migration verification + staging deploy checklist.
5. Add analytics/observability foundation.
6. Define a strict curriculum schema/publish validator.
7. Expand reviewed N5 into a genuine level-complete course.
8. Build and review N4, N3, N2, N1 instead of unlocking empty levels.
9. Add listening curriculum, romaji fade, adaptive mastery, and downloaded lesson packs.
10. Expand automated + physical-device QA.

## Definition of “anyone can learn Japanese here”

Do not claim this until a new learner can progress from kana through a complete reviewed N5 course, higher JLPT levels contain real published content, every skill has meaningful mastery evidence, progress survives devices/failures, and operations/backup/monitoring are strong enough to protect learner history.
