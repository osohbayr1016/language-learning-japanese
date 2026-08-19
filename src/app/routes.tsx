import React from 'react';
import type { RouteObject } from 'react-router-dom';

/**
 * Every URL the site serves.
 *
 * These were expo-router file routes. The parenthesised layout groups are gone
 * — `(tabs)/home` is just `/home` — because a group was never part of the URL,
 * only of how the native navigator was assembled.
 *
 * Each screen is lazy so a visitor downloads the page they asked for and not
 * the other 57. The old export shipped all of them in one 3.1 MB file.
 */

const lazy = (loader: () => Promise<{ default: React.ComponentType }>) =>
  React.lazy(loader);

export const routes: RouteObject[] = [
  // ── Entry ────────────────────────────────────────────────────────────────
  { index: true, Component: lazy(() => import('./IndexRedirect')) },

  // ── Auth ─────────────────────────────────────────────────────────────────
  { path: 'login', Component: lazy(() => import('@src/features/auth/LoginScreen')) },
  { path: 'register', Component: lazy(() => import('@src/features/auth/RegisterScreen')) },
  { path: 'onboarding', Component: lazy(() => import('@src/features/onboarding/OnboardingScreen')) },
  { path: 'setup', Component: lazy(() => import('@src/features/setup/SetupScreen')) },

  // ── Main sections (the tab bar) ──────────────────────────────────────────
  { path: 'home', Component: lazy(() => import('@src/features/home/HomeScreen')) },
  { path: 'study', Component: lazy(() => import('@src/features/study/StudyHubScreen')) },
  { path: 'kanji', Component: lazy(() => import('@src/features/kanji/KanjiScreen')) },
  { path: 'games', Component: lazy(() => import('@src/features/games/GamesHubScreen')) },
  { path: 'profile', Component: lazy(() => import('@src/features/profile/ProfileScreen')) },

  // ── Study ────────────────────────────────────────────────────────────────
  { path: 'study/flashcard', Component: lazy(() => import('@screens/study/flashcard')) },
  { path: 'study/flashcards', Component: lazy(() => import('@screens/study/flashcards')) },
  { path: 'study/learn', Component: lazy(() => import('@screens/study/learn')) },
  { path: 'study/weak', Component: lazy(() => import('@screens/study/weak')) },
  { path: 'study/write', Component: lazy(() => import('@screens/study/write')) },
  { path: 'study/writer', Component: lazy(() => import('@screens/study/writer')) },
  { path: 'study/speak', Component: lazy(() => import('@screens/study/speak')) },
  { path: 'study/mock-exam', Component: lazy(() => import('@screens/study/mock-exam')) },
  { path: 'study/hanzi', Component: lazy(() => import('@screens/study/hanzi')) },
  { path: 'study/grammar', Component: lazy(() => import('@screens/study/grammar/index')) },
  { path: 'study/grammar/:id', Component: lazy(() => import('@screens/study/grammar/[id]')) },

  // ── Games ────────────────────────────────────────────────────────────────
  { path: 'games/match', Component: lazy(() => import('@screens/games/match')) },
  { path: 'games/sentence', Component: lazy(() => import('@screens/games/sentence')) },
  { path: 'games/stroke', Component: lazy(() => import('@screens/games/stroke')) },
  { path: 'games/translate', Component: lazy(() => import('@screens/games/translate')) },
  { path: 'games/missing-word', Component: lazy(() => import('@screens/games/missing-word')) },
  { path: 'games/missing-stroke', Component: lazy(() => import('@screens/games/missing-stroke')) },

  // ── Content ──────────────────────────────────────────────────────────────
  { path: 'kanji/:id', Component: lazy(() => import('@screens/kanji/[id]')) },
  { path: 'lessons', Component: lazy(() => import('@screens/lessons/index')) },
  { path: 'lessons/:id', Component: lazy(() => import('@screens/lessons/[id]')) },
  { path: 'cartoons/:id', Component: lazy(() => import('@screens/cartoons/[id]')) },

  // ── Profile ──────────────────────────────────────────────────────────────
  { path: 'profile/avatar', Component: lazy(() => import('@screens/profile/avatar')) },
  { path: 'profile/insights', Component: lazy(() => import('@screens/profile/insights')) },
  { path: 'profile/settings', Component: lazy(() => import('@screens/profile/settings')) },
  { path: 'profile/vocabulary', Component: lazy(() => import('@screens/profile/vocabulary')) },
  { path: 'profile/word/:id', Component: lazy(() => import('@screens/profile/word/[id]')) },

  // ── Admin ────────────────────────────────────────────────────────────────
  // Guarded in RootLayout: signed in AND is_admin, else bounced.
  { path: 'admin', Component: lazy(() => import('@screens/admin/index')) },
  { path: 'admin/dashboard', Component: lazy(() => import('@screens/admin/dashboard')) },
  { path: 'admin/cartoons', Component: lazy(() => import('@screens/admin/cartoons')) },
  { path: 'admin/exam-import', Component: lazy(() => import('@screens/admin/exam-import')) },
  { path: 'admin/hsk1-lessons', Component: lazy(() => import('@screens/admin/hsk1-lessons')) },
  { path: 'admin/learning-path', Component: lazy(() => import('@screens/admin/learning-path')) },
  { path: 'admin/lesson-html-import', Component: lazy(() => import('@screens/admin/lesson-html-import')) },
  { path: 'admin/lesson/:id', Component: lazy(() => import('@screens/admin/lesson/[id]')) },
  { path: 'admin/lesson-preview/:id', Component: lazy(() => import('@screens/admin/lesson-preview/[id]')) },
  { path: 'admin/users', Component: lazy(() => import('@screens/admin/users')) },
  { path: 'admin/vocabulary', Component: lazy(() => import('@screens/admin/vocabulary')) },
  { path: 'admin/word/:id', Component: lazy(() => import('@screens/admin/word/[id]')) },
  { path: 'admin/words', Component: lazy(() => import('@screens/admin/words')) },
  { path: 'admin/words/new', Component: lazy(() => import('@screens/admin/words/new')) },

  { path: '*', Component: lazy(() => import('./NotFound')) },
];

/** Legacy expo-router URLs, so an old bookmark or shared link still lands. */
export const legacyRedirects: Record<string, string> = {
  '/(tabs)/home': '/home',
  '/(tabs)/study': '/study',
  '/(tabs)/kanji': '/kanji',
  '/(tabs)/games': '/games',
  '/(tabs)/profile': '/profile',
  '/(auth)/login': '/login',
  '/(auth)/register': '/register',
  '/(onboarding)': '/onboarding',
  '/(setup)': '/setup',
};
