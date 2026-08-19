import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const APP_TITLE = 'Япон хэл сурах';
const META_DESC =
  'Япон хэл сурах апп — хичээл, тоглоом, дуу сонсох. Learn Japanese with lessons, games, and audio.';

/**
 * Server-rendered HTML shell for the Expo web build. Viewport allows pinch-zoom;
 * global CSS overrides expo-router's body overflow:hidden so tall pages can scroll.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="mn">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#BE4A79" />
        <meta name="description" content={META_DESC} />
        <meta property="og:title" content={APP_TITLE} />
        <meta property="og:description" content={META_DESC} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <title>{APP_TITLE}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalCss }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.lang='mn';document.title=${JSON.stringify(APP_TITLE)};`,
          }}
        />
      </head>
      <body>
        <div id="web-boot-splash" aria-hidden="true">
          <div className="boot-inner">
            <div className="boot-logo" />
            <div className="boot-line" />
            <div className="boot-line short" />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}

const globalCss = `
:root {
  --plum: #BE4A79;
  --plum-dark: #9C3862;
  --teal: #2B7B88;
  --paper: #F6F4F1;
  --ink: #1C1917;
  --focus: #2B6CB0;
}

html, body, #root { height: 100%; margin: 0; padding: 0; }

/* Override expo-router ScrollViewStyleReset: allow vertical scroll + zoom elsewhere */
body {
  overflow-x: hidden;
  overflow-y: auto;
  /* Warm brand wash that fades into paper. Done here rather than as a View so
     it is a real gradient instead of a hard-edged block. */
  background: var(--paper);
  background-image: linear-gradient(180deg, #FDF2F6 0px, #FAF5F3 260px, var(--paper) 520px);
  background-attachment: fixed;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-family: "Noto Sans", "Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

#root { display: flex; flex-direction: column; min-height: 100%; background: transparent; }

/* Tapping a control on mobile Safari/Chrome should not flash a grey box —
   the app draws its own press states. */
* { -webkit-tap-highlight-color: transparent; }

/* One focus ring for the whole site, matching the in-app token. Only for
   keyboard users, so pointer clicks stay clean. */
:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
  border-radius: 6px;
}
input:focus-visible, textarea:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

/* Selection in brand colour instead of the browser default blue. */
::selection { background: #F6D9E4; color: var(--ink); }

/* Desktop frame for the app column. Driven by a media query rather than JS so
   it tracks live window resizing and never depends on a hook resolving before
   first paint. Below 720px the column stays edge-to-edge — a floating card on
   a phone reads as broken. */
@media (min-width: 720px) {
  #app-column {
    margin-top: 28px;
    margin-bottom: 28px;
    min-height: calc(100% - 56px);
    border-radius: 24px;
    border: 1px solid #E7E3DE;
    box-shadow: 0 18px 44px rgba(63, 42, 51, 0.16);
    overflow: hidden;
  }
}

/* Slim, unobtrusive scrollbar on the desktop frame. */
@media (min-width: 720px) {
  * { scrollbar-width: thin; scrollbar-color: #D8D2CC transparent; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: #D8D2CC;
    border-radius: 999px;
    border: 3px solid transparent;
    background-clip: content-box;
  }
  ::-webkit-scrollbar-thumb:hover { background: #BDB6AE; background-clip: content-box; }
}

/* Boot splash — brand plum, and shaped like the screen that follows so the
   handover doesn't jump. (It used to be a Duolingo-green gradient left over
   from a template, which is the first thing a visitor saw.) */
#web-boot-splash {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  transition: opacity 0.22s cubic-bezier(0.2, 0, 0, 1);
}
#web-boot-splash .boot-inner { width: 240px; text-align: center; }
#web-boot-splash .boot-logo {
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--plum), var(--teal));
  box-shadow: 0 8px 22px rgba(190, 74, 121, 0.32);
  animation: boot-pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
#web-boot-splash .boot-line {
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(90deg, #EAE5E0 25%, #F3EFEB 37%, #EAE5E0 63%);
  background-size: 400% 100%;
  margin-bottom: 8px;
  animation: boot-shimmer 1.4s linear infinite;
}
#web-boot-splash .boot-line.short { width: 65%; margin-left: auto; margin-right: auto; }

@keyframes boot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.92); opacity: 0.78; }
}
@keyframes boot-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

/* Respect the OS "reduce motion" setting across every animation we ship. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
`;
