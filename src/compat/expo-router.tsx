/**
 * expo-router, reimplemented on React Router.
 *
 * 81 files import from 'expo-router'. Rewriting them all would be a big-bang
 * change with no way to test it incrementally, so instead the module itself is
 * swapped: same API surface, browser navigation underneath. Screens keep
 * `router.push('/study/learn')` and stop caring that there is no native stack.
 *
 * The one real translation is route GROUPS. Expo encodes layout grouping in the
 * path — `/(tabs)/home`, `/(auth)/login` — but those parenthesised segments are
 * not part of a URL. Every href is stripped of them, so `/(tabs)/home` navigates
 * to `/home`, which is also what the address bar should read.
 */
import React from 'react';
import {
  Link as RouterLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

export type Href = string;

/** `/(tabs)/home` -> `/home`. Group segments are layout metadata, not URL. */
export function stripGroups(href: string): string {
  const cleaned = href.replace(/\/\([^)]*\)/g, '');
  return cleaned === '' ? '/' : cleaned;
}

type NavTarget = Href | { pathname: string; params?: Record<string, unknown> };

function toPath(target: NavTarget): string {
  if (typeof target === 'string') return stripGroups(target);
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(target.params ?? {})) {
    if (v != null) query.set(k, String(v));
  }
  const qs = query.toString();
  return stripGroups(target.pathname) + (qs ? `?${qs}` : '');
}

/**
 * The imperative router (218 call sites).
 *
 * expo-router exposes a module-level singleton usable outside React. React
 * Router has no such thing, so the active navigate function is parked here by
 * <RouterBridge/> on every render. Before the first render it falls back to
 * history.pushState, which keeps early redirects from throwing.
 */
let navigateRef: ((to: string, opts?: { replace?: boolean }) => void) | null = null;

function fallbackNavigate(to: string, opts?: { replace?: boolean }) {
  if (typeof window === 'undefined') return;
  if (opts?.replace) window.history.replaceState({}, '', to);
  else window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function go(to: string, opts?: { replace?: boolean }) {
  (navigateRef ?? fallbackNavigate)(to, opts);
}

export const router = {
  push: (target: NavTarget) => go(toPath(target)),
  navigate: (target: NavTarget) => go(toPath(target)),
  replace: (target: NavTarget) => go(toPath(target), { replace: true }),
  back: () => window.history.back(),
  canGoBack: () => window.history.length > 1,
  dismiss: () => window.history.back(),
  dismissAll: () => go('/'),
  setParams: (params: Record<string, unknown>) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) {
      if (v == null) url.searchParams.delete(k);
      else url.searchParams.set(k, String(v));
    }
    go(url.pathname + url.search, { replace: true });
  },
};

export type Router = typeof router;

export function useRouter(): Router {
  return router;
}

/** Keeps the module-level `router` pointed at the live navigate function. */
export function RouterBridge() {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigateRef = (to, opts) => navigate(to, { replace: opts?.replace });
    return () => {
      navigateRef = null;
    };
  }, [navigate]);
  return null;
}

/** Path params and query string merged, which is what expo-router hands back. */
export function useLocalSearchParams<T = Record<string, string>>(): T {
  const params = useParams();
  const [search] = useSearchParams();
  return React.useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) if (v != null) out[k] = v;
    for (const [k, v] of search.entries()) out[k] = v;
    return out as T;
  }, [params, search]);
}

export const useGlobalSearchParams = useLocalSearchParams;

export function usePathname(): string {
  return useLocation().pathname;
}

/** Path split into segments, e.g. /study/learn -> ['study', 'learn']. */
export function useSegments<T extends string[] = string[]>(): T {
  const { pathname } = useLocation();
  return React.useMemo(() => pathname.split('/').filter(Boolean) as T, [pathname]);
}

/**
 * Native re-runs this whenever a screen regains focus. On the web a route is
 * either mounted or it is not, so mount is the only focus event there is.
 */
export function useFocusEffect(effect: React.EffectCallback) {
  const { pathname } = useLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(effect, [pathname]);
}

export function Redirect({ href }: { href: Href }) {
  return <Navigate to={stripGroups(href)} replace />;
}

type LinkProps = {
  href: Href;
  children: React.ReactNode;
  replace?: boolean;
  style?: React.CSSProperties;
  asChild?: boolean;
  onPress?: () => void;
};

export function Link({ href, children, replace, style, onPress }: LinkProps) {
  return (
    <RouterLink
      to={stripGroups(href)}
      replace={replace}
      onClick={onPress}
      style={{ textDecoration: 'none', color: 'inherit', ...style }}
    >
      {children}
    </RouterLink>
  );
}

/** Renders the matched child route — the whole job of a layout file. */
export function Slot() {
  return <Outlet />;
}

/**
 * `<Stack>` and `<Tabs>` were native navigators. The real navigation chrome is
 * the browser (back button, address bar) plus the site's own tab bar, so these
 * render their child route and nothing else.
 *
 * `<Stack.Screen options={{title}}/>` still carries the page title, so it is
 * honoured by setting document.title rather than being thrown away.
 */
function ScreenOptions({ options }: { options?: { title?: string } }) {
  const title = options?.title;
  React.useEffect(() => {
    if (title) document.title = `${title} · Япон хэл сурах`;
  }, [title]);
  return null;
}

type NavigatorProps = { children?: React.ReactNode };

function makeNavigator(name: string) {
  const Navigator = ({ children }: NavigatorProps) => {
    // Screen declarations are configuration, not output; only real children
    // (a layout's own chrome) should render.
    const rendered = React.Children.toArray(children).filter(
      (c) => React.isValidElement(c) && (c.type as { displayName?: string })?.displayName !== `${name}.Screen`
    );
    return (
      <>
        {rendered}
        <Outlet />
      </>
    );
  };
  Navigator.displayName = name;

  const Screen = ScreenOptions as React.FC<{ name?: string; options?: Record<string, unknown> }>;
  Screen.displayName = `${name}.Screen`;

  return Object.assign(Navigator, { Screen });
}

export const Stack = makeNavigator('Stack');
export const Tabs = makeNavigator('Tabs');

export default { router, useRouter, Link, Redirect, Slot, Stack, Tabs };
