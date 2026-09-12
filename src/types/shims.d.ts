// Typing gaps in the browser build. react-native-web ships no .d.ts, and the
// Worker entry uses Cloudflare's Fetcher without pulling in workers-types.
declare module 'react-native-web';
declare type Fetcher = { fetch: (request: Request) => Promise<Response> };
