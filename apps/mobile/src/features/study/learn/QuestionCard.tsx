import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { JapaneseText, RomajiRow } from '../../../components/japanese';
import { PronounceButton } from '../../../components/audio/PronounceButton';
import { Card } from '../../../primitives';
import { colors, spacing, typography } from '../../../theme';
import { useDisplayPrefs } from '../../../context/DisplayPrefsContext';
import type { WordWithProgress } from '../../../lib/types';

type Props = {
  word: WordWithProgress;
  promptType: 'jp-to-mn' | 'mn-to-jp';
};

export function QuestionCard({ word, promptType }: Props) {
  const { showRomaji } = useDisplayPrefs();

  return (
    <Card padding="lg" variant="elevated" style={styles.card}>
      {promptType === 'jp-to-mn' ? (
        <View style={styles.center}>
          <JapaneseText text={word.kanji || word.kana || ''} size="lg" />
          {showRomaji ? <RomajiRow romaji={word.romaji ?? ''} size="md" /> : null}
          <PronounceButton wordId={word.id} meaningMn={word.meaning_mn} size="md" style={{ marginTop: spacing.sm }} />
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.label}>Японоор аль нь зөв вэ?</Text>
          <Text style={styles.prompt}>{word.meaning_mn}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 200, justifyContent: 'center', marginBottom: spacing.lg },
  center: { alignItems: 'center', gap: spacing.sm },
  label: { ...typography.body.md, color: colors.text.secondary },
  prompt: { ...typography.heading.xl, color: colors.text.primary, textAlign: 'center' },
});
