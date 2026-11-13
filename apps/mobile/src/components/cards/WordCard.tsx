import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Pill } from '../../primitives';
import { JapaneseText, RomajiRow } from '../japanese';
import { PronounceButton } from '../audio/PronounceButton';
import { colors, spacing, typography } from '../../theme';
import type { Word } from '../../lib/types';
import { jlptNLabel } from '../../lib/jlptLabel';

type Props = {
  word: Word;
  onPress?: () => void;
  showAudio?: boolean;
  compact?: boolean;
};

export function WordCard({ word, onPress, showAudio = true, compact = false }: Props) {
  const jlptColor = colors.jlpt[word.jlpt_level as keyof typeof colors.jlpt] ?? colors.accent.purple;

  return (
    <Card onPress={onPress} padding={compact ? 'sm' : 'md'} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <JapaneseText text={word.kanji} size={compact ? 'sm' : 'md'} align="left" />
          <RomajiRow romaji={word.romaji ?? ''} size={compact ? 'sm' : 'md'} align="left" />
          <Text style={styles.meaning} numberOfLines={2}>{word.meaning_mn}</Text>
        </View>
        <View style={styles.right}>
          <Pill label={jlptNLabel(word.jlpt_level)} color={jlptColor} />
          {showAudio ? (
            <PronounceButton wordId={word.id} meaningMn={word.meaning_mn} size="sm" style={{ marginTop: spacing.sm }} />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  left: { flex: 1, gap: 4 },
  right: { alignItems: 'flex-end' },
  meaning: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
