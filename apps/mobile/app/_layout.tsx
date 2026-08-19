import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform } from "react-native";

import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { AudioProvider } from "../src/context/AudioContext";
import { GamificationProvider } from "../src/context/GamificationContext";
import { DisplayPrefsProvider } from "../src/context/DisplayPrefsContext";
import { AppShell } from "../src/primitives/AppShell";
import { colors } from "../src/theme";

SplashScreen.preventAutoHideAsync();

function RouteGuard() {
  const { isAuthenticated, isLoading, hasSeenOnboarding, isAdmin } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    const inSetup = segments[0] === "(setup)";
    const inTabs = segments[0] === "(tabs)";
    const rootSegment = segments[0] as string | undefined;
    const inAdmin = rootSegment === "admin";

    if (inAdmin) {
      if (!isAuthenticated) {
        router.replace("/(auth)/login?reason=protected");
        return;
      }
      if (!isAdmin) {
        router.replace("/(tabs)/home");
        return;
      }
      return;
    }

    if (isAuthenticated) {
      if (!inTabs && (inAuth || inOnboarding || inSetup)) {
        router.replace("/(tabs)/home");
      }
    } else {
      if (!hasSeenOnboarding && !inOnboarding) {
        router.replace("/(onboarding)");
      } else if (hasSeenOnboarding && !inAuth && !inOnboarding && !inSetup) {
        router.replace("/(auth)/login?reason=protected");
      }
    }
  }, [isAuthenticated, isLoading, hasSeenOnboarding, isAdmin, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const g = globalThis as typeof globalThis & {
      document?: { getElementById: (id: string) => HTMLElement | null };
      setTimeout?: typeof setTimeout;
    };
    const node = g.document?.getElementById("web-boot-splash");
    if (!node) return;
    const el = node as unknown as { style: { opacity: string }; remove: () => void };
    el.style.opacity = "0";
    (g.setTimeout ?? setTimeout)(() => el.remove(), 220);
  }, []);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg.primary,
      card: colors.bg.primary,
      text: colors.text.primary,
      border: colors.border,
      primary: colors.brand.primary,
    },
  };

  return (
    <GestureHandlerRootView
      // Transparent on web so the page backdrop behind the app column shows.
      // Painting it white here covered the whole viewport and made the desktop
      // frame invisible.
      style={{
        flex: 1,
        backgroundColor: Platform.OS === "web" ? "transparent" : colors.bg.primary,
      }}
    >
      <ThemeProvider value={navTheme}>
        <AuthProvider>
          <AudioProvider>
            <GamificationProvider>
              <DisplayPrefsProvider>
                <StatusBar style="dark" />
                <AppShell>
                  <RouteGuard />
                </AppShell>
              </DisplayPrefsProvider>
            </GamificationProvider>
          </AudioProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
