import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import type { OnboardingStrings } from './onboardingCopy';
import { SpeakPhraseButton } from './SpeakPhraseButton';
import type { OnboardingSlide as Slide } from './slides';

type Props = { slide: Slide; strings: OnboardingStrings };

export function OnboardingSlide({ slide, strings }: Props) {
  const caption = strings[slide.copyKey];
  return (
    <View style={styles.slide}>
      <View style={styles.imageWrap}>
        <Image source={slide.image} style={styles.image} resizeMode="contain" />
      </View>
      <View style={styles.text}>
        <View style={styles.headlineRow}>
          <Text style={styles.japanese}>{slide.japanese}</Text>
          <SpeakPhraseButton phrase={slide.japanese} accessibilityLabel={strings.speakJapanese} />
        </View>
        <Text style={styles.romaji}>{slide.romaji}</Text>
        <Text style={styles.title}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { alignItems: 'center', paddingTop: spacing.lg },
  imageWrap: {
    width: '85%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  text: { alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  headlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  japanese: {
    ...typography.kanji.md,
    color: colors.text.primary,
  },
  romaji: {
    ...typography.romaji.md,
    color: colors.accent.purple,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  title: {
    ...typography.heading.lg,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 32,
  },
});
