import React from "react";
import {
  Alert,
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
        onPress={() => router.push("/forgot-password" as never)}
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
