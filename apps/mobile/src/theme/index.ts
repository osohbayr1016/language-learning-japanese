import { Platform } from 'react-native';
import { sansFontFamily } from './fontFamily';

const F = sansFontFamily ? ({ fontFamily: sansFontFamily } as const) : {};

/**
 * Palette notes — every value that can carry text or an icon is contrast-checked.
 *
 * Rule of the system: a solid accent is dark enough to work BOTH as foreground
 * on white (>= 4.5:1, WCAG AA) and as a fill under white text. The airy sakura
 * feeling comes from the `soft` washes behind those solids, not from washing
 * out the ink itself.
 */
export const colors = {
  bg: {
    primary: '#FFFFFF',
    /** Page/backdrop behind the app column. */
    secondary: '#F6F4F1',
    card: '#FFFFFF',
    /** Recessed surface: progress tracks, empty slots, inset rows. */
    elevated: '#F6F4F1',
    input: '#FFFFFF',
    /** Warm paper tone for large passive areas. */
    washi: '#FAF8F6',
  },

  accent: {
    purple: '#8A4FD8',
    blue: '#2B7B88', // Muted teal
    teal: '#0B7F96',
    pink: '#C14D5C', // Deep sakura rose
    green: '#1B8450',
    amber: '#9A6400',
  },

  /** Very light washes — backgrounds only, never text. */
  soft: {
    purple: '#F4F1FA',
    blue: '#EFF6F7',
    teal: '#ECF6F8',
    pink: '#FCEFF1',
    green: '#ECF7F1',
    amber: '#FAF3E6',
    brand: '#FDF2F6',
    sakura: '#FEE4D1',
  },

  brand: {
    primary: '#BE4A79', // Red plum
    primaryDark: '#9C3862',
    primaryShadow: '#9C3862',
    /** Lifted tone for hover on brand-filled surfaces. */
    primaryHover: '#CB5686',
    secondary: '#2B7B88', // Muted teal
  },

  tone: {
    1: '#C2410C', // High flat
    2: '#A35A00', // Rising
    3: '#BE4A79', // Falling-rising
    4: '#2B7B88', // Falling
    0: '#6B7280', // Neutral
  },

  jlpt: {
    1: '#BE4A79', // N5
    2: '#2B7B88', // N4
    3: '#0B7F96', // N3
    4: '#8A4FD8', // N2
    5: '#A35A00', // N1
  },

  text: {
    primary: '#1C1917',
    secondary: '#4B5563',
    /** 4.83:1 on white — safe for real copy, unlike the old #9CA3AF (2.54:1). */
    muted: '#6B7280',
    /** Decorative only: dividers, placeholder glyphs. Never for readable text. */
    faint: '#A8A29E',
    inverse: '#FFFFFF',
  },

  success: '#1B8450',
  error: '#D93B3B',
  warning: '#A35A00',
  info: '#2B6CB0',

  border: '#E7E3DE',
  borderLight: '#F1EEEA',
  /** Visible boundary for interactive controls that need a real edge. */
  borderStrong: '#CFCBC5',
  /** Keyboard focus ring — one colour everywhere. */
  focus: '#2B6CB0',

  overlay: 'rgba(28,25,23,0.55)',
};

/** Hex + alpha, so tints stop being hand-written template strings. */
export function tint(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  kanji: {
    xl: { fontSize: 88, fontWeight: '300' as const, letterSpacing: 4, ...F },
    lg: { fontSize: 64, fontWeight: '300' as const, letterSpacing: 2, ...F },
    md: { fontSize: 40, fontWeight: '400' as const, ...F },
    sm: { fontSize: 28, fontWeight: '400' as const, ...F },
  },
  /** @deprecated Use `kanji` — kept for legacy imports */
  hanzi: {
    xl: { fontSize: 88, fontWeight: '300' as const, letterSpacing: 4, ...F },
    lg: { fontSize: 64, fontWeight: '300' as const, letterSpacing: 2, ...F },
    md: { fontSize: 40, fontWeight: '400' as const, ...F },
    sm: { fontSize: 28, fontWeight: '400' as const, ...F },
  },
  romaji: {
    lg: { fontSize: 22, letterSpacing: 2, ...F },
    md: { fontSize: 18, letterSpacing: 1, ...F },
    sm: { fontSize: 14, letterSpacing: 0.5, ...F },
  },
  /** @deprecated Use `romaji` */
  pinyin: {
    lg: { fontSize: 22, letterSpacing: 2, ...F },
    md: { fontSize: 18, letterSpacing: 1, ...F },
    sm: { fontSize: 14, letterSpacing: 0.5, ...F },
  },
  heading: {
    xl: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.4, ...F },
    lg: { fontSize: 24, lineHeight: 30, fontWeight: '800' as const, letterSpacing: -0.3, ...F },
    md: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const, letterSpacing: -0.1, ...F },
    sm: { fontSize: 15, lineHeight: 20, fontWeight: '700' as const, ...F },
  },
  body: {
    lg: { fontSize: 16, lineHeight: 24, ...F },
    md: { fontSize: 14, lineHeight: 21, ...F },
    sm: { fontSize: 12, lineHeight: 18, ...F },
    /** Was referenced across the app but never defined — the spread silently no-op'd. */
    xs: { fontSize: 11, lineHeight: 16, ...F },
  },
  /** All-caps section kickers. */
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
    ...F,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#3F2A33',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#3F2A33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3F2A33',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  /** Raised state for pointer hover on web. */
  hover: {
    shadowColor: '#3F2A33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 7,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  }),
};

export const gradients = {
  hero: ['#BE4A79', '#2B7B88'] as const,
  flame: ['#C2410C', '#A35A00'] as const,
  success: ['#1B8450', '#2B7B88'] as const,
};

/**
 * One motion language for the whole app. Interactions must feel instant on
 * press and calm on enter — anything slower than ~250ms on a tap reads laggy.
 */
export const motion = {
  duration: {
    /** Press-in / press-out. */
    instant: 90,
    fast: 140,
    base: 200,
    slow: 320,
    /** Progress fills, celebratory reveals. */
    lazy: 520,
  },
  scale: {
    /** Small controls: chips, icon buttons. */
    pressSm: 0.94,
    /** Buttons and tiles. */
    press: 0.97,
    /** Large surfaces — anything lower looks rubbery. */
    pressLg: 0.985,
    hover: 1.02,
  },
  /** CSS timing functions for the web build. */
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

const isWeb = Platform.OS === 'web';

/**
 * Shared interaction styling. Import these instead of re-inventing a
 * `pressed: { opacity: 0.85 }` per file — that drift is what made taps feel
 * arbitrary from screen to screen.
 */
export const interaction = {
  /** Web-only: pointer cursor + GPU-smoothed transitions. */
  web: isWeb
    ? ({
        cursor: 'pointer',
        transitionProperty: 'transform, box-shadow, background-color, border-color, opacity',
        transitionDuration: `${motion.duration.fast}ms`,
        transitionTimingFunction: motion.easing.standard,
        userSelect: 'none',
      } as const)
    : null,
  /** Consistent keyboard focus ring. */
  focusRing: isWeb
    ? ({
        outlineStyle: 'solid',
        outlineWidth: 3,
        outlineColor: colors.focus,
        outlineOffset: 2,
      } as const)
    : null,
  /** Minimum comfortable tap target (Apple HIG and Material both land here). */
  minTapTarget: 44,
} as const;

/** Web `AppShell`: centered app column for the whole app (including `/admin`). */
export const layout = {
  phoneWebMaxWidth: 480,
} as const;
