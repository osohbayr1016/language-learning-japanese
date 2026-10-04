import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { useDisplayPrefs } from '../../context/DisplayPrefsContext';
import { mn } from '../../i18n/mn';
import { colors, spacing, typography } from '../../theme';

export function RomajiToggleWeb() {
  const { showRomaji, toggleShowRomaji } = useDisplayPrefs();
  if (Platform.OS !== 'web') return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={showRomaji ? mn.study.romajiOn : mn.study.romajiOff}
      onPress={() => void toggleShowRomaji()}
      style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.tx}>{showRomaji ? mn.study.romajiOn : mn.study.romajiOff}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tx: { ...typography.body.sm, color: colors.text.secondary, fontWeight: '600' },
});
