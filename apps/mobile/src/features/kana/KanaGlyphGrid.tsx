import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, interaction, radius, shadows, spacing, typography } from '../../theme';
import { getKanaRomaji } from '../../lib/content/kanaRomaji';
import { Touchable } from '../../primitives/Touchable';

type Props = {
  sectionTitle: string;
  rows: string[][];
  onPickChar: (c: string) => void;
};

/** The consonant that names each row of the gojūon chart. */
function rowLabel(row: string[]): string {
  const first = row.find(Boolean);
  if (!first) return '';
  const r = getKanaRomaji(first);
  // "a" row has no consonant; "n" stands alone.
  return r.length > 1 ? r.slice(0, -1) : r === 'a' ? '–' : r;
}

/**
 * The standard 5-column kana chart, each glyph with its romaji beneath it and
 * the row's consonant on the left. Beginners were getting glyphs alone and had
 * to open every one to learn how it sounds.
 */
export function KanaGlyphGrid({ sectionTitle, rows, onPickChar }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          <Text style={styles.rowLabel} accessibilityElementsHidden>
            {rowLabel(row)}
          </Text>
          {row.map((ch, ci) =>
            ch ? (
              <Touchable
                key={`${ri}-${ci}`}
                accessibilityLabel={`${ch}, ${getKanaRomaji(ch)}`}
                style={styles.cell}
                hoveredStyle={styles.cellHovered}
                scaleTo={0.94}
                hoverLift={2}
                onPress={() => onPickChar(ch)}
              >
                <Text style={styles.glyph}>{ch}</Text>
                <Text style={styles.romaji}>{getKanaRomaji(ch)}</Text>
              </Touchable>
            ) : (
              <View key={`${ri}-${ci}-e`} style={styles.cellSpacer} />
            )
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.heading.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.xs, marginBottom: spacing.xs },
  rowLabel: {
    width: 22,
    ...typography.body.xs,
    fontWeight: '700',
    color: colors.text.faint,
    textAlign: 'center',
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? ({ userSelect: 'none' } as const) : null),
  },
  cellSpacer: { flex: 1, aspectRatio: 0.92 },
  cell: {
    flex: 1,
    aspectRatio: 0.92,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    ...shadows.sm,
    ...(interaction.web ?? null),
  },
  cellHovered: { borderColor: colors.brand.primary, backgroundColor: colors.soft.brand },
  glyph: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 30,
  },
  romaji: {
    ...typography.body.xs,
    color: colors.text.muted,
    marginTop: 1,
  },
});
