/**
 * The `extra` block the app used to read from app.config.ts.
 *
 * Only VITE_API_URL is surfaced, and only when it is actually set. This must
 * NOT fall back to a hard-coded API host: lib/api/publicUrl.ts checks
 * `Constants.expoConfig.extra.apiUrl` BEFORE its own DEFAULT_PRODUCTION_API, so
 * a guess here would override the correct default in production. Leaving it
 * undefined lets that resolver do its job — localhost:8787 while developing,
 * the production Worker otherwise.
 */
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || undefined;

const extra = apiUrl ? { apiUrl } : {};

export default {
  expoConfig: { extra },
  manifest: { extra },
  expoVersion: null,
};
