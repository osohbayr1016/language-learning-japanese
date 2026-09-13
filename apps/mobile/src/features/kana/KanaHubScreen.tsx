import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../primitives';
import { colors, radius, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../../lib/content/kanaTable';
import { KanaGlyphGrid } from './KanaGlyphGrid';
import { KanaWriteDialog } from './KanaWriteDialog';

export default function KanaHubScreen() {
  const [picked, setPicked] = useState<string | null>(null);

  const closeDialog = useCallback(() => setPicked(null), []);

  return (
    <Screen scroll scrollBottomInset={70}>
      <View style={styles.header}>
        <Text style={styles.title}>{mn.kana.hubTitle}</Text>
        <Text style={styles.subtitle}>{mn.kana.hubSub}</Text>
      </View>

      <KanaGlyphGrid sectionTitle={mn.kana.hiragana} rows={HIRAGANA_ROWS} onPickChar={setPicked} />
      <KanaGlyphGrid sectionTitle={mn.kana.katakana} rows={KATAKANA_ROWS} onPickChar={setPicked} />

      <KanaWriteDialog visible={picked !== null} glyph={picked ?? ''} onClose={closeDialog} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.soft.teal,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand.secondary + '40',
  },
  title: {
    ...typography.heading.lg,
    color: colors.brand.secondary,
    marginBottom: 6,
  },
  subtitle: { ...typography.body.md, color: colors.text.secondary },
});
