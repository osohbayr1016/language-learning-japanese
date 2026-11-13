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
    const response=await env.ASSETS.fetch(request);
    const headers=new Headers(response.headers);
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('X-Frame-Options','DENY');
    headers.set('Referrer-Policy',url.pathname==='/reset-password'?'no-referrer':'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy','microphone=(self), camera=(), geolocation=()');
    if(['/release.json','/manifest.webmanifest','/course-worker.js','/sw.js','/offline-manifest.json'].includes(url.pathname))headers.set('Cache-Control','no-cache');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  },
};
