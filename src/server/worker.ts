/**
 * The Worker in front of the site.
 *
 * Static assets are served by Cloudflare directly; this only exists to hide the
 * route manifest that the old Expo export published at /_sitemap.
 */
export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/_sitemap' || url.pathname.endsWith('/_sitemap')) {
      return new Response('Not Found', { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
};
