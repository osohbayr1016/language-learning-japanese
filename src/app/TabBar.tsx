import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, typography } from "@src/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

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
    path: "/course",
    label: "Сурах",
    icon: "home-outline",
    activeIcon: "home",
    hint: "Өнөөдрийн хичээл ба JLPT зам",
    matches: (p) =>
      p === "/home" || p === "/course" || p.startsWith("/lessons/"),
  },
  {
    path: "/course?tab=practice",
    label: "Дадлага",
    icon: "barbell-outline",
    activeIcon: "barbell",
    hint: "Давталт, кана, канжи, ярих, бичих",
    matches: (p) =>
      p === "/study" ||
      p.startsWith("/study/") ||
      p === "/kana" ||
      p.startsWith("/kana/") ||
      p === "/kanji" ||
      p.startsWith("/kanji/") ||
      p === "/games" ||
      p.startsWith("/games/"),
  },
  {
    path: "/course?tab=milestones",
    label: "Явц",
    icon: "stats-chart-outline",
    activeIcon: "stats-chart",
    hint: "XP, streak, ур чадварын өсөлт",
    matches: (p) => p === "/profile/insights",
  },
  {
    path: "/course?tab=settings",
    label: "Профайл",
    icon: "person-circle-outline",
    activeIcon: "person-circle",
    hint: "Профайл ба тохиргоо",
    matches: (p) =>
      p === "/profile" ||
      (p.startsWith("/profile/") && p !== "/profile/insights"),
  },
];

export const TAB_PATHS = new Set(TABS.map((t) => t.path));
export const TAB_BAR_PATHS = new Set([
  ...TAB_PATHS,
  "/course",
  "/study",
  "/profile",
  "/profile/insights",
  "/home",
  "/kana",
  "/kanji",
  "/games",
]);

export function TabBar() {
  const { pathname, search } = useLocation();

  return (
    <nav className="tabbar" aria-label="Үндсэн цэс">
      <Link
        to="/course"
        className="tabbar__brand"
        aria-label="Япон хэл сурах — нүүр"
      >
        <span className="tabbar__brand-mark">日</span>
        <span className="tabbar__brand-copy">
          <strong>Nihongo</strong>
          <small>Монгол хэлээр япон хэл</small>
        </span>
      </Link>

      <div className="tabbar__items">
        {TABS.map((tab) => {
          const active =
            pathname === "/course"
              ? tab.path.includes("?")
                ? tab.path.endsWith(
                    "=" + new URLSearchParams(search).get("tab"),
                  )
                : !["practice", "milestones", "settings"].includes(
                    new URLSearchParams(search).get("tab") ?? "today",
                  )
              : tab.matches(pathname);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`tabbar__item${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
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
