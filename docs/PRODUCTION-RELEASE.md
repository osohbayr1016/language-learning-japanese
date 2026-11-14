# Japanese production integration

The independent course and the earlier product-hardening branch are integrated with both Git parents retained. Conflicts keep the Japanese-only schemas, published content IDs, strict root npm validation, durable progress and course worker from PR #5. Useful PR #4 work is retained: all-level JLPT admin, local-word TTS without nonexistent numeric IDs, native-safe keyboard handling and PWA installation. Old foreign-language aliases and the cache-clearing second service worker are superseded.

## Release path

A deliberate manual release on main runs the production workflow: web/API types, isolation, domain/API and release tests, build, JavaScript budget and Chromium journeys. It then checks the dedicated Cloudflare database identity and existing JWT secret, records a D1 Time Travel bookmark, applies outstanding migrations, deploys API, verifies schema/revision, deploys web, and checks the public course, PWA, offline pack and anonymous-auth boundary. Merging code to main only runs quality checks: it never deploys or migrates production. A missing Cloudflare token or restore point fails before database mutation. Bookmark artifacts contain no user rows or secret values. Manual release calls the same workflow.

The API and website expose the deployed Git SHA through health/release metadata. The two endpoints must match the release commit. The account and database IDs remain pinned to the Japanese resources. No worker signing key is generated or rotated during release. The optional Azure and recovery-mail secrets must be supplied by the operator; their absence is reported by capabilities and does not become a fabricated success.

## Recovery and verification

Use the recorded D1 bookmark only after deciding whether a data restore is necessary; restoring overwrites current rows. An application rollback normally leaves additive migrations in place. Do not upload full database exports to this public repository's artifacts. Keep private backups within authorized storage. The bookmark depends on Cloudflare's retention window and is not a permanent archival export.

Before a broad speech release, verify actual Japanese recordings and email delivery on iPhone Safari and Android Chrome. Full N3–N1 teaching content, held-out full-length mocks and independent Japanese/Mongolian editorial review remain separate content work. Current automated checks do not certify those outcomes.
