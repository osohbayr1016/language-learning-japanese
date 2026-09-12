import { mn } from '@src/i18n/mn';
import { study } from '@src/i18n/strings/study';
import { games } from '@src/i18n/strings/games';
import { insights } from '@src/i18n/strings/insights';

export const SITE_NAME = 'Япон хэл сурах';

/**
 * Exact `pathname` → page name.
 *
 * Every route used to share one `<title>`, so browser tabs, history entries and
 * bookmarks were all indistinguishable, and a screen reader announced the same
 * words on every navigation.
 */
const EXACT: Record<string, string> = {
  '/': SITE_NAME,
  // The concise verbs, not the long screen headings — a browser tab
  // truncates around 20 characters.
  '/login': mn.auth.signIn,
  '/register': mn.auth.signUp,
  '/onboarding': 'Танилцуулга',
  '/setup': 'Бүртгэл үүсгэх',

  '/home': mn.tabs.home,
  '/study': mn.tabs.study,
  '/kanji': mn.tabs.kanji,
  '/games': games.hub,
  '/profile': mn.tabs.profile,

  '/study/flashcard': study.flashcard,
  '/study/flashcards': study.flashcard,
  '/study/learn': study.learn,
  '/study/weak': study.weakReviewTitle,
  '/study/write': study.write,
  '/study/writer': study.writer,
  '/study/speak': study.speak,
  '/study/grammar': study.grammarTitle,
  '/study/mock-exam': study.mockExamTitle,
  '/study/hanzi': mn.tabs.kanji,

  '/games/match': games.match,
  '/games/translate': games.translate,
  '/games/sentence': games.sentence,
  '/games/stroke': games.stroke,
  '/games/missing-word': games.sentence,
  '/games/missing-stroke': games.stroke,

  '/profile/insights': insights.title,
  '/profile/settings': 'Тохиргоо',
  '/profile/vocabulary': 'Миний үгс',
  '/profile/avatar': 'Профайл зураг',

  '/lessons': 'Хичээлүүд',
  '/cartoons': 'Хүүхэлдэйн кино',
  '/admin': 'Админ',
};

/** Longest-prefix fallbacks, for the routes that carry an `:id`. */
const PREFIXES: [string, string][] = [
  ['/study/grammar/', study.grammarTitle],
  ['/lessons/', 'Хичээл'],
  ['/kanji/', mn.tabs.kanji],
  ['/cartoons/', 'Хүүхэлдэйн кино'],
  ['/profile/word/', 'Үг'],
  ['/admin/', 'Админ'],
];

/** Page name for a pathname, without the site suffix. */
export function pageNameForPath(pathname: string): string | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (EXACT[clean]) return EXACT[clean];

  let best: string | null = null;
  let bestLen = 0;
  for (const [prefix, name] of PREFIXES) {
    if (clean.startsWith(prefix) && prefix.length > bestLen) {
      best = name;
      bestLen = prefix.length;
    }
  }
  return best;
}

export const NOT_FOUND_TITLE = 'Хуудас олдсонгүй';

/** Full `document.title`: "Page · Site", or just the site name at the root. */
export function titleForPath(pathname: string): string {
  const name = pageNameForPath(pathname) ?? NOT_FOUND_TITLE;
  if (name === SITE_NAME) return SITE_NAME;
  return `${name} · ${SITE_NAME}`;
}
