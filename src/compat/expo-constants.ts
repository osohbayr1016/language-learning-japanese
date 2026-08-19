/** Config the app used to read from app.config.ts `extra`. Now plain Vite env. */
const apiUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'https://japanese-learning-api.osohoo691016.workers.dev';

export default {
  expoConfig: { extra: { apiUrl } },
  manifest: { extra: { apiUrl } },
  expoVersion: null,
};
