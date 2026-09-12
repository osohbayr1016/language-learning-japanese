import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ToneColoredText, PinyinRow } from '../hanzi';
import { PronounceButton } from '../audio/PronounceButton';
import type { Word } from '../../lib/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = {
  word: Word;
  /** Written form the learner is asked to say. */
  japanese: string;
  /** Romaji reading shown under it. */
  reading: string;
  exampleAside: string | null;
  pronounceStyle?: ViewStyle;
  /** When false, hide Mongolian gloss and the MN audio shortcut on pronounce controls. */
  showMongolianMeaning?: boolean;
};

export function SpeakWordCardFace({
  word,
  japanese,
  reading,
  exampleAside,
  pronounceStyle,
  showMongolianMeaning = true,
}: Props) {
  return (
    <View style={styles.card}>
      <ToneColoredText hanzi={japanese} size="md" />
      <PinyinRow pinyin={reading} size="md" />
      {exampleAside ? <Text style={styles.exampleHint}>{exampleAside}</Text> : null}
      {showMongolianMeaning ? (
        <Text style={styles.translation}>{word.example_mn ?? word.meaning_mn}</Text>
      ) : null}
      <PronounceButton
        wordId={word.id}
        meaningMn={showMongolianMeaning ? word.meaning_mn : undefined}
        wordHanzi={word.kanji}
        displayText={japanese}
        size="md"
        style={pronounceStyle ?? styles.pronounce}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  exampleHint: {
    ...typography.body.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  translation: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  pronounce: { marginTop: spacing.md },
});
