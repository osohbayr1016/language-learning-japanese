import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const at = (p: string) => path.resolve(__dirname, p);

/**
 * The website build.
 *
 * There is no Expo dev server, no Metro, no native toolchain — `npm run dev`
 * starts Vite and nothing else.
 *
 * Two kinds of alias below:
 *
 *  1. MIGRATION SEAM (@screens, @src). The screens still live in the old
 *     apps/mobile tree while the design-system refactor finishes landing there.
 *     Aliasing instead of moving means the site runs as a real website today
 *     without yanking files out from under work in progress. When that work is
 *     done the directories move under src/ and these two lines are deleted —
 *     nothing else in the config changes.
 *
 *  2. NATIVE -> WEB. Every Expo/React Native module is mapped to a browser
 *     implementation in src/compat. This is what lets 27k lines of existing
 *     screen code run in a plain browser tab with no native runtime.
 */
export default defineConfig({
  plugins: [react()],

  resolve: {
    // Order matters: the specific module aliases must win over the bare
    // `react-native` -> `react-native-web` rule at the bottom.
    alias: [
      { find: '@screens', replacement: at('apps/mobile/app') },
      { find: '@src', replacement: at('apps/mobile/src') },

      { find: /^expo-router\/html$/, replacement: at('src/compat/expo-router-html.tsx') },
      { find: /^expo-router$/, replacement: at('src/compat/expo-router.tsx') },

      { find: /^expo-constants$/, replacement: at('src/compat/expo-constants.ts') },
      { find: /^expo-splash-screen$/, replacement: at('src/compat/expo-splash-screen.ts') },
      { find: /^expo-status-bar$/, replacement: at('src/compat/expo-status-bar.tsx') },
      { find: /^expo-haptics$/, replacement: at('src/compat/expo-haptics.ts') },
      { find: /^expo-font$/, replacement: at('src/compat/expo-font.ts') },
      { find: /^expo-secure-store$/, replacement: at('src/compat/expo-secure-store.ts') },
      { find: /^expo-linking$/, replacement: at('src/compat/expo-linking.ts') },
      { find: /^expo-av$/, replacement: at('src/compat/expo-av.ts') },
      { find: /^expo-speech$/, replacement: at('src/compat/expo-speech.ts') },
      { find: /^expo-speech-recognition$/, replacement: at('src/compat/expo-speech-recognition.ts') },
      { find: /^expo-file-system$/, replacement: at('src/compat/expo-file-system.ts') },
      { find: /^expo-document-picker$/, replacement: at('src/compat/expo-document-picker.ts') },

      { find: /^react-native-gesture-handler$/, replacement: at('src/compat/react-native-gesture-handler.tsx') },
      { find: /^react-native-safe-area-context$/, replacement: at('src/compat/react-native-safe-area-context.tsx') },
      { find: /^react-native-webview$/, replacement: at('src/compat/react-native-webview.tsx') },
      { find: /^react-native-reanimated$/, replacement: at('src/compat/react-native-reanimated.ts') },
      { find: /^@react-navigation\/native$/, replacement: at('src/compat/react-navigation-native.tsx') },
      // Its default entry reaches into React Native's Flow-typed internals for
      // the native Fabric components. Its own web entry does not export Svg /
      // Circle / Path, so this maps onto real SVG instead.
      { find: /^react-native-svg$/, replacement: at('src/compat/react-native-svg.tsx') },
      // Ships untranspiled JSX in .js, and its barrel dragged in 19 icon fonts
      // for the one family this app uses. See the compat module for detail.
      { find: /^@expo\/vector-icons$/, replacement: at('src/compat/expo-vector-icons.tsx') },

      // Must be last.
      { find: /^react-native$/, replacement: 'react-native-web' },
    ],

    // `.web.tsx` wins over `.tsx`, the same precedence the old bundler used —
    // it is how HanziWriterView picks its browser implementation.
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.jsx', '.jsx', '.web.js', '.js', '.json'],
  },

  define: {
    // react-native-web and several Expo modules branch on these.
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    global: 'globalThis',
  },

  optimizeDeps: {
    // Pre-bundling crawls node_modules with esbuild, where React Native's
    // Flow-typed source is a parse error. Nothing native should reach it —
    // every one of these is aliased to a browser implementation above.
    exclude: [
      'react-native',
      'react-native-svg',
      'react-native-reanimated',
      'react-native-gesture-handler',
      'react-native-webview',
      'react-native-safe-area-context',
      '@expo/vector-icons',
      'expo-router',
      'expo-av',
      'expo-speech',
      'expo-speech-recognition',
      'expo-haptics',
      'expo-secure-store',
      'expo-file-system',
      'expo-document-picker',
      'expo-constants',
      'expo-font',
      'expo-linking',
      'expo-splash-screen',
      'expo-status-bar',
      '@react-navigation/native',
    ],
  },

  server: {
    port: 5173,
    open: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    // Route-level chunks come from the dynamic import() per route in
    // src/app/routes.tsx — the old export shipped all 58 routes to every
    // visitor in one 3.1 MB file. Vendor splitting is left to Rollup: hand-
    // written manualChunks produced a circular vendor <-> vendor-rnw pair for
    // no measurable gain.
  },
});
