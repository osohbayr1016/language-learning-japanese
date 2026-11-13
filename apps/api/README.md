# API — Cloudflare Workers + D1 + R2

## Local dev

```bash
cd apps/api
npx wrangler d1 migrations apply nihongo-mn-db --local
npm run dev   # wrangler dev on http://localhost:8787
```

The mobile app picks this up via `EXPO_PUBLIC_API_URL=http://localhost:8787` (the default in `apps/mobile/src/lib/api/client.ts`).

## Production deploy (one-time)

Run from `apps/api/` after `npx wrangler login`:

```bash
# 1. Create the D1 DB and copy the printed database_id into both
#    [[d1_databases]] blocks in wrangler.toml (dev + env.production).
npx wrangler d1 create nihongo-mn-db

# 2. Create the R2 bucket for cached audio.
npx wrangler r2 bucket create nihongo-mn-media

# 3. Apply schema + seed to the REMOTE D1.
npx wrangler d1 migrations apply nihongo-mn-db --remote --env production

# 4. Set the JWT signing secret as a Worker secret (NOT in wrangler.toml).
npx wrangler secret put JWT_SECRET --env production
# paste a long random string when prompted

# 5. Deploy the Worker. Outputs a https://nihongo-mn-api.<acct>.workers.dev URL.
npx wrangler deploy --env production
```

## Updating CORS after the web is deployed

When the website is live at `https://<project>.pages.dev`, update
`[env.production.vars].CORS_ORIGIN` in `wrangler.toml` to include both the
Pages origin and any custom domain:

```toml
CORS_ORIGIN = "https://nihongo-mn-web.osohoo691016.workers.dev,https://yourdomain.com"
```

Then re-deploy:

```bash
npx wrangler deploy --env production
```

## Re-deploying after schema changes

```bash
npx wrangler d1 migrations apply nihongo-mn-db --remote --env production
npx wrangler deploy --env production
```
