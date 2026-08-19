import React, { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ActivityIndicator, View } from 'react-native-web';

import { AuthProvider, useAuth } from '@src/context/AuthContext';
import { AudioProvider } from '@src/context/AudioContext';
import { GamificationProvider } from '@src/context/GamificationContext';
import { DisplayPrefsProvider } from '@src/context/DisplayPrefsContext';
import { AppShell } from '@src/primitives/AppShell';
import { colors } from '@src/theme';

import { RouterBridge } from '../compat/expo-router';
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

function PageSpinner() {
  return (
    <View style={{ flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.brand.primary} />
    </View>
  );
}

function Shell() {
  useRouteGuard();
  const { pathname } = useLocation();
  const showTabs = TAB_PATHS.has(pathname);

  return (
    <AppShell>
      <Suspense fallback={<PageSpinner />}>
        <Outlet />
      </Suspense>
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
