import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, layout as layoutTokens } from '../theme';

type Props = { children: React.ReactNode };

/**
 * On web: centers the app in a single column (same for main app and `/admin`).
 * On native: pass-through.
 *
 * The column used to float as a bare white strip with hard left/right rules
 * against flat grey — the clearest "unfinished" signal on a desktop browser.
 * The desktop frame (rounded corners, margin, drop shadow) is applied by a CSS
 * media query on `#app-column` in `app/+html.tsx`, not from JS: it is a
 * web-only concern, it responds to live window resizing for free, and it does
 * not depend on a dimensions hook resolving before first paint.
 */
export function AppShell({ children }: Props) {
  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <View style={styles.page as ViewStyle}>
      <View
        nativeID="app-column"
        style={[styles.column as ViewStyle, { maxWidth: layoutTokens.phoneWebMaxWidth }]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: '100%' as unknown as number,
    width: '100%',
    // Transparent so the body's brand gradient (see `+html.tsx`) shows through.
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  column: {
    width: '100%',
    flexGrow: 1,
    flexShrink: 0,
    minHeight: '100%' as unknown as number,
    backgroundColor: colors.bg.primary,
    alignSelf: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
    overflow: 'hidden',
  },
});
