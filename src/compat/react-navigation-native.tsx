import React from 'react';

/**
 * The app used @react-navigation only to hand a colour theme to the native
 * navigators. There are no native navigators any more, so the theme is simply
 * passed through and the site's own CSS owns the chrome.
 */
export const DefaultTheme = {
  dark: false,
  colors: {
    primary: '#BE4A79',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1C1917',
    border: '#E7E3DE',
    notification: '#BE4A79',
  },
};
export const DarkTheme = DefaultTheme;

export function ThemeProvider({ children }: { value?: unknown; children?: React.ReactNode }) {
  return <>{children}</>;
}
export function useTheme() {
  return DefaultTheme;
}
export { useFocusEffect } from './expo-router';
