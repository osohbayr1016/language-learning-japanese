# Production status

## Integrated source

Runtime source is integrated in main at `0557dc9ae744acf01b2ae4521a515ef4afaf5e4b`.
PR #4 and PR #5 are merged. PR #2 duplicated the head already merged by PR #3 and was closed without discarding source changes. All five remote feature/UI branches were compared with main: each has zero commits ahead. There are no open pull requests.

## Verified on main

The production workflow passed web/API TypeScript, Japanese isolation, 67 domain/API/release tests, the production build and JavaScript chunk budget, and all 37 Chromium learner journeys. The PR's root production-dependency audit (`npm audit --omit=dev`) also passed; this does not claim that all development-tool advisories are resolved or that native-device QA was performed.

[Production workflow run](https://github.com/osohbayr1016/language-learning-japanese/actions/runs/43482918836)

## Live release is blocked

The run failed at **Verify credentials and record a D1 restore point** with:

`CLOUDFLARE_API_TOKEN is required; no database changes were made.`

Database migrations, API deployment, website deployment and live smoke checks were skipped. The existing live environment has not been upgraded by this run. The code passing CI must not be described as a successful production deployment.

## Required operator configuration

1. Add `CLOUDFLARE_API_TOKEN` to this repository's GitHub Actions secrets (or its production environment secrets). The token must be authorized for the existing pinned Cloudflare account's Japanese Worker scripts and D1 database. Never place the credential in source, comments or an artifact.
2. Run **Release Japanese production** from the Actions tab on `main`, or rerun the failed production job. It will verify database identity, existing JWT signing-secret presence and a D1 Time Travel restore point before applying migrations, then deploy API before web and verify deployed revisions.
3. Resolve any further explicit provider-permission/configuration failure before describing the release as live. Do not generate or rotate an existing signing secret as a workaround.

Optional Japanese server speech and acoustic assessment require `SPEECH_KEY`/`SPEECH_REGION`; password-recovery mail requires `AUTH_MAIL_API_KEY`/`AUTH_MAIL_FROM`/`APP_ORIGIN`. Actual provider availability must be verified after deployment. Full N3–N1 teaching content, independent editorial review, held-out full-length mocks and physical iPhone/Android microphone QA remain outside the completed automated checks.
