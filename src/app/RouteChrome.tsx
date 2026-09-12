import React from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

import { NOT_FOUND_TITLE, pageNameForPath, titleForPath } from './routeTitles';

/**
 * The things a browser does for free on a multi-page site and that a
 * single-page app has to put back by hand.
 *
 * 1. `document.title` per route. Without it every tab, history entry and
 *    bookmark reads "Япон хэл сурах" and there is no way to tell them apart.
 * 2. A polite live-region announcement. Changing the URL moves no focus, so a
 *    screen reader user gets silence after tapping a tab and has no idea the
 *    page changed.
 * 3. Focus reset. Focus stays on the link that was clicked, so the next Tab
 *    press continues from the old page's position instead of the new page's
 *    start.
 *
 * Scroll is handled separately by react-router's <ScrollRestoration/>, which
 * also restores position on back/forward — something a manual scrollTo(0,0)
 * would get wrong.
 */
export function RouteChrome() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const [message, setMessage] = React.useState('');
  const anchorRef = React.useRef<HTMLDivElement | null>(null);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    document.title = titleForPath(pathname);

    // Nothing to announce or re-focus on the very first paint: the page the
    // visitor asked for is the page they got.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Back/forward already carries its own user intent; announce, but leave
    // focus alone so restored scroll position is not fought over.
    const name = pageNameForPath(pathname) ?? NOT_FOUND_TITLE;
    setMessage(name);

    if (navigationType !== 'POP') {
      anchorRef.current?.focus({ preventScroll: true });
    }
  }, [pathname, navigationType]);

  return (
    <>
      {/* Focus lands here, off-screen but focusable, so the next Tab starts at
          the top of the new page. tabIndex -1 keeps it out of the tab order. */}
      <div ref={anchorRef} tabIndex={-1} style={SR_ONLY} aria-hidden="true" />
      <div role="status" aria-live="polite" aria-atomic="true" style={SR_ONLY}>
        {message}
      </div>
    </>
  );
}

/** Visually hidden but still exposed to assistive tech. */
const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};
