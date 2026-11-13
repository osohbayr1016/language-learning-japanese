import React from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import type { AuthLocaleStrings } from "../../i18n/authLocales";
import { colors, spacing, typography } from "../../theme";

export function AuthForgotLink({ strings }: { strings: AuthLocaleStrings }) {
  const router = useRouter();
  return (
    <View style={styles.forgotRow}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (Platform.OS === "web") {
            router.push("/forgot-password" as never);
            return;
          }
          // Recovery links target the trusted web origin; native has no matching
          // Expo file route. Open the same recovery flow in the system browser.
          const origin =
            process.env.EXPO_PUBLIC_WEB_BASE_URL ??
            "https://nihongo-mn-web.osohoo691016.workers.dev";
          void Linking.openURL(
            origin.replace(/\/$/, "") + "/forgot-password",
          ).catch(() =>
            Alert.alert(
              strings.forgotPassword,
              "Сэргээх хуудсыг нээж чадсангүй. Холболтоо шалгаад дахин оролдоно уу.",
            ),
          );
        }}
      >
        <Text style={styles.forgot}>{strings.forgotPassword}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  forgotRow: { alignItems: "flex-end", marginBottom: spacing.sm },
  forgot: {
    ...typography.body.sm,
    color: colors.brand.secondary,
    fontWeight: "700",
  },
});
