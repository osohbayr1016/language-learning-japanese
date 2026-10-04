import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Tab = {
  path: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
  hint: string;
  matches: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  {
    path: '/home',
    label: 'Сурах',
    icon: 'home-outline',
    activeIcon: 'home',
    hint: 'Өнөөдрийн хичээл ба JLPT зам',
    matches: (p) => p === '/home' || p.startsWith('/lessons/'),
  },
  {
    path: '/study',
    label: 'Дадлага',
    icon: 'barbell-outline',
    activeIcon: 'barbell',
    hint: 'Давталт, кана, канжи, ярих, бичих',
    matches: (p) =>
      p === '/study' ||
      p.startsWith('/study/') ||
      p === '/kana' ||
      p.startsWith('/kana/') ||
      p === '/kanji' ||
      p.startsWith('/kanji/') ||
      p === '/games' ||
      p.startsWith('/games/'),
  },
  {
    path: '/profile/insights',
    label: 'Явц',
    icon: 'stats-chart-outline',
    activeIcon: 'stats-chart',
    hint: 'XP, streak, ур чадварын өсөлт',
    matches: (p) => p === '/profile/insights',
  },
  {
    path: '/profile',
    label: 'Профайл',
    icon: 'person-circle-outline',
    activeIcon: 'person-circle',
    hint: 'Профайл ба тохиргоо',
    matches: (p) => p === '/profile' || (p.startsWith('/profile/') && p !== '/profile/insights'),
  },
];

export const TAB_PATHS = new Set(TABS.map((t) => t.path));
export const TAB_BAR_PATHS = new Set([
  ...TAB_PATHS,
  '/kana',
  '/kanji',
  '/games',
]);

export function TabBar() {
  const { pathname } = useLocation();

  return (
    <nav className="tabbar" aria-label="Үндсэн цэс">
      <Link to="/home" className="tabbar__brand" aria-label="Япон хэл сурах — нүүр">
        <span className="tabbar__brand-mark">日</span>
        <span className="tabbar__brand-copy">
          <strong>Nihongo</strong>
          <small>Монгол хэлээр япон хэл</small>
        </span>
      </Link>

      <div className="tabbar__items">
        {TABS.map((tab) => {
          const active = tab.matches(pathname);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`tabbar__item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-label={`${tab.label}. ${tab.hint}`}
            >
              <span className="tabbar__pill">
                <Ionicons
                  name={active ? tab.activeIcon : tab.icon}
                  size={23}
                  color={active ? colors.brand.primary : colors.text.muted}
                />
              </span>
              <span className="tabbar__label">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const tabBarTokens = {
  height: 74,
  radius: radius.md,
  gap: spacing.xxs,
  labelSize: typography.body.xs.fontSize,
  active: colors.brand.primary,
  idle: colors.text.muted,
};
