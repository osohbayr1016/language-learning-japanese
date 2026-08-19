import React from 'react';
import glyphMap from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json';
import fontUrl from '@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf?url';

/**
 * Ionicons, without @expo/vector-icons.
 *
 * Two reasons this module exists rather than the real package:
 *
 *  1. It ships untranspiled JSX inside .js files, which no standard web
 *     bundler will parse.
 *  2. Importing from its barrel pulled in EVERY icon family — the old build
 *     emitted 19 font files totalling 3,981 KB, of which this app used exactly
 *     one. Ionicons alone is 389 KB.
 *
 * The glyph map (name -> codepoint) and the font both already ship inside the
 * package, so this renders the same glyphs with none of the weight.
 *
 * Longer term the 48 icons this app actually uses would be better as inline
 * SVG — single-digit KB, and no flash of unstyled icon while a font loads.
 */

export type IoniconName = keyof typeof glyphMap;

const FONT_FAMILY = 'Ionicons';

/** Injected once, on first render, rather than at import time. */
let fontInjected = false;
function ensureFont() {
  if (fontInjected || typeof document === 'undefined') return;
  fontInjected = true;
  const style = document.createElement('style');
  style.textContent = `@font-face{font-family:"${FONT_FAMILY}";src:url("${fontUrl}") format("truetype");font-display:block;}`;
  document.head.appendChild(style);
}

export type IconProps = {
  name: IoniconName;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  accessibilityLabel?: string;
  testID?: string;
};

export function Ionicons({
  name,
  size = 24,
  color = 'currentColor',
  style,
  accessibilityLabel,
  testID,
}: IconProps) {
  ensureFont();
  const codepoint = glyphMap[name];

  if (codepoint == null) {
    // An unknown name used to render an invisible box. Better to render nothing
    // and leave the layout intact than to show a tofu glyph.
    return null;
  }

  return (
    <span
      data-testid={testID}
      aria-hidden={accessibilityLabel ? undefined : true}
      aria-label={accessibilityLabel}
      role={accessibilityLabel ? 'img' : undefined}
      style={{
        fontFamily: `"${FONT_FAMILY}"`,
        fontSize: size,
        lineHeight: 1,
        width: size,
        height: size,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontVariant: 'normal',
        textTransform: 'none',
        WebkitFontSmoothing: 'antialiased',
        flexShrink: 0,
        ...style,
      }}
    >
      {String.fromCodePoint(codepoint)}
    </span>
  );
}

Ionicons.glyphMap = glyphMap;

export default { Ionicons };
