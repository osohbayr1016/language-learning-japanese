import type React from 'react';
import { StyleSheet } from 'react-native-web';

/**
 * Collapse a React Native style prop into a plain CSS object.
 *
 * RN styles are frequently arrays — `style={[styles.pill, isActive && styles.on]}`
 * appears 176 times in this codebase. Spreading one of those into a DOM element
 * (`style={{ ...style }}`) turns the array indices into keys, and React then
 * tries to assign `element.style[0]`, which throws:
 *
 *     Failed to set an indexed property [0] on 'CSSStyleDeclaration'
 *
 * Any compat component that renders a real DOM node instead of a
 * react-native-web component has to funnel its style through here first.
 */
export function toCssStyle(style: unknown): React.CSSProperties {
  const flat = StyleSheet.flatten(style as never) as Record<string, unknown> | null | undefined;
  if (!flat || typeof flat !== 'object') return {};

  const css: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flat)) {
    if (value == null) continue;

    switch (key) {
      // RN describes shadows in four separate props; CSS has one.
      case 'shadowColor':
      case 'shadowOffset':
      case 'shadowOpacity':
      case 'shadowRadius':
      case 'elevation':
        break;

      // RN takes an array of single-key objects: [{ scale: 0.9 }, { translateY: 4 }]
      case 'transform':
        css.transform = Array.isArray(value) ? cssTransform(value) : value;
        break;

      // Android-only text metrics with no CSS meaning.
      case 'includeFontPadding':
      case 'textAlignVertical':
        break;

      default:
        css[key] = value;
    }
  }

  const shadow = cssShadow(flat);
  if (shadow) css.boxShadow = shadow;

  return css as React.CSSProperties;
}

function cssTransform(transforms: unknown[]): string {
  return transforms
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return '';
      return Object.entries(entry as Record<string, unknown>)
        .map(([fn, raw]) => {
          // Rotations carry their own unit; scales are unitless; lengths are px.
          if (typeof raw !== 'number') return `${fn}(${String(raw)})`;
          if (fn.startsWith('scale') || fn === 'opacity') return `${fn}(${raw})`;
          if (fn.startsWith('rotate') || fn.startsWith('skew')) return `${fn}(${raw}deg)`;
          return `${fn}(${raw}px)`;
        })
        .join(' ');
    })
    .filter(Boolean)
    .join(' ');
}

function cssShadow(flat: Record<string, unknown>): string | null {
  const color = flat.shadowColor;
  if (typeof color !== 'string') return null;
  const offset = (flat.shadowOffset ?? {}) as { width?: number; height?: number };
  const radius = typeof flat.shadowRadius === 'number' ? flat.shadowRadius : 0;
  const opacity = typeof flat.shadowOpacity === 'number' ? flat.shadowOpacity : 1;
  const x = offset.width ?? 0;
  const y = offset.height ?? 0;
  return `${x}px ${y}px ${radius}px ${withAlpha(color, opacity)}`;
}

/** `#RRGGBB` + opacity -> `#RRGGBBAA`. Other formats are passed through. */
function withAlpha(color: string, opacity: number): string {
  if (opacity >= 1) return color;
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${a}`;
}
