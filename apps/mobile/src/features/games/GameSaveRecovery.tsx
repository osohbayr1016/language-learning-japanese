import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Screen } from '../../primitives';
import { colors, spacing, typography } from '../../theme';

/** Keep a completed game visible and retry the exact same idempotent submission. */
export function GameSaveRecovery({ onRetry }: { onRetry: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Text accessibilityRole="alert" style={{ ...typography.heading.sm, color: colors.error }}>
          Тоглоомын үр дүн хадгалагдсангүй
        </Text>
        <Text style={{ ...typography.body.md, color: colors.text.secondary }}>
          Сүлжээгээ шалгаад дахин оролдоорой. Авсан оноо хэвээр, давхар XP олгохгүй.
        </Text>
        <Button label="ДАХИН ХАДГАЛАХ" loading={busy} disabled={busy} onPress={() => {
          if (busy) return;
          setBusy(true);
          void onRetry().finally(() => setBusy(false));
        }} />
      </View>
    </Screen>
  );
}
