import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../primitives';
import { JapaneseText, RomajiRow } from '../../../components/japanese';
import { PronounceButton } from '../../../components/audio/PronounceButton';
import { colors, spacing, typography } from '../../../theme';
import type { Word } from '../../../lib/types';

type Props = {
  word: Word;
  direction: 'jp-to-mn' | 'mn-to-jp';
};

export function TranslateQuestion({ word, direction }: Props) {
  return (
    <Card padding="lg" variant="elevated" style={styles.card}>
      {direction === 'jp-to-mn' ? (
        <View style={styles.center}>
          <JapaneseText text={word.kanji} size="lg" />
          <RomajiRow romaji={word.romaji ?? ''} size="md" />
          <PronounceButton wordId={word.id} meaningMn={word.meaning_mn} size="md" style={{ marginTop: spacing.sm }} />
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.label}>Орчуул</Text>
          <Text style={styles.prompt}>{word.meaning_mn}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 180, justifyContent: 'center', marginBottom: spacing.md },
  center: { alignItems: 'center', gap: spacing.xs },
  label: { ...typography.body.md, color: colors.text.secondary },
  prompt: { ...typography.heading.xl, color: colors.text.primary, textAlign: 'center' },
});
