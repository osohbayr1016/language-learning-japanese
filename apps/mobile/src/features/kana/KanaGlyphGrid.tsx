import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type Props = {
  sectionTitle: string;
  rows: string[][];
  onPickChar: (c: string) => void;
};

export function KanaGlyphGrid({ sectionTitle, rows, onPickChar }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((ch, ci) =>
            ch ? (
              <Pressable
                key={`${ri}-${ci}`}
                accessibilityRole="button"
                accessibilityLabel={ch}
                style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
                onPress={() => onPickChar(ch)}
              >
                <Text style={styles.glyph}>{ch}</Text>
              </Pressable>
            ) : (
              <View key={`${ri}-${ci}-e`} style={styles.cellSpacer} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.heading.sm,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '800',
  },
  row: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  cellSpacer: { flex: 1, aspectRatio: 1 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  cellPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  glyph: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 32,
  },
});
