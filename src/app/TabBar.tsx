import React from 'react';
import { NavLink } from 'react-router-dom';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '@src/theme';
import { mn } from '@src/i18n/mn';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Tab = { path: string; label: string; icon: IconName; activeIcon: IconName; hint: string };

const TABS: Tab[] = [
  { path: '/home', label: mn.tabs.home, icon: 'home-outline', activeIcon: 'home', hint: 'Өнөөдрийн зорилго, давталт' },
  { path: '/study', label: mn.tabs.study, icon: 'book-outline', activeIcon: 'book', hint: 'Хичээл ба дасгалууд' },
  { path: '/kanji', label: mn.tabs.kanji, icon: 'language-outline', activeIcon: 'language', hint: 'Ханз тэмдэгт' },
  { path: '/games', label: mn.tabs.games, icon: 'game-controller-outline', activeIcon: 'game-controller', hint: 'Тоглоом' },
  { path: '/profile', label: mn.tabs.profile, icon: 'person-outline', activeIcon: 'person', hint: 'Профайл ба тохиргоо' },
];

export const TAB_PATHS = new Set(TABS.map((t) => t.path));

/**
 * The section switcher, as real anchors.
 *
 * It was a native tab navigator; now each tab is an <a> with an href, so the
 * browser gives back middle-click, open-in-new-tab, and a URL worth sharing.
 * Styling lives in index.html next to the rest of the site CSS rather than in
 * a StyleSheet, because this is chrome the page owns.
 */
export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Үндсэн цэс">
      {TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) => `tabbar__item${isActive ? ' is-active' : ''}`}
          aria-label={`${tab.label}. ${tab.hint}`}
        >
          {({ isActive }) => (
            <>
              <span className="tabbar__pill">
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? colors.brand.primary : colors.text.muted}
                />
              </span>
              <span className="tabbar__label">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** Exported so the stylesheet and this file cannot drift apart silently. */
export const tabBarTokens = {
  height: 74,
  radius: radius.md,
  gap: spacing.xxs,
  labelSize: typography.body.xs.fontSize,
  active: colors.brand.primary,
  idle: colors.text.muted,
};
