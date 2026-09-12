import React, { Suspense } from 'react';
import { Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';

import { AuthProvider, useAuth } from '@src/context/AuthContext';
import { AudioProvider } from '@src/context/AudioContext';
import { GamificationProvider } from '@src/context/GamificationContext';
import { DisplayPrefsProvider } from '@src/context/DisplayPrefsContext';
import { AppShell } from '@src/primitives/AppShell';

import { RouterBridge } from '../compat/expo-router';
import { ErrorBoundary } from './ErrorBoundary';
import { RouteChrome } from './RouteChrome';
import { TabBar, TAB_PATHS } from './TabBar';

/** Routes reachable without an account. */
const PUBLIC_PATHS = new Set(['/login', '/register', '/onboarding', '/setup']);

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

/**
 * Who is allowed where.
 *
 * Ported from the old native RouteGuard, but written against real URLs instead
 * of expo-router's segment groups — `/login` rather than `['(auth)','login']`.
 */
function useRouteGuard() {
  const { isAuthenticated, isLoading, hasSeenOnboarding, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoading) return;

    if (isAdminPath(pathname)) {
      if (!isAuthenticated) navigate('/login?reason=protected', { replace: true });
      else if (!isAdmin) navigate('/home', { replace: true });
      return;
    }

    if (isAuthenticated) {
      if (PUBLIC_PATHS.has(pathname)) navigate('/home', { replace: true });
      return;
    }

    if (!hasSeenOnboarding && pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    } else if (hasSeenOnboarding && !PUBLIC_PATHS.has(pathname)) {
      navigate('/login?reason=protected', { replace: true });
    }
  }, [isAuthenticated, isLoading, hasSeenOnboarding, isAdmin, pathname, navigate]);
}

/**
 * Shown while a route's JS chunk downloads.
 *
 * A bare centred spinner on an otherwise empty card gave no sense of what was
 * coming; this holds the shape of a typical screen (title, then cards) so the
 * hand-off to real content does not jump the layout.
 */
function PageSkeleton() {
  return (
    <div className="skeleton" role="status" aria-label="Ачаалж байна">
      <div className="skeleton__line skeleton__line--title" />
      <div className="skeleton__line skeleton__line--sub" />
      <div className="skeleton__card" />
      <div className="skeleton__card skeleton__card--short" />
    </div>
  );
}

function Shell() {
  useRouteGuard();
  const { pathname } = useLocation();
  const showTabs = TAB_PATHS.has(pathname);

  return (
    <AppShell>
      {/* Sends every new page to the top and restores position on back/forward.
          Without it a tap on a tab landed the visitor part-way down the next
          page, at whatever offset the previous one happened to be scrolled. */}
      <ScrollRestoration />
      <RouteChrome />
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
      {showTabs ? <TabBar /> : null}
    </AppShell>
  );
}

/** Removes the boot shell painted by index.html once React has content up. */
function useDismissBootSplash() {
  React.useEffect(() => {
    const node = document.getElementById('web-boot-splash');
    if (!node) return;
    node.style.opacity = '0';
    const t = setTimeout(() => node.remove(), 220);
    return () => clearTimeout(t);
  }, []);
}

export default function RootLayout() {
  useDismissBootSplash();
  return (
    <AuthProvider>
      <AudioProvider>
        <GamificationProvider>
          <DisplayPrefsProvider>
            <RouterBridge />
            <Shell />
          </DisplayPrefsProvider>
        </GamificationProvider>
      </AudioProvider>
    </AuthProvider>
  );
}
