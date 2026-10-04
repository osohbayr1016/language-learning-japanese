import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { JapaneseText, RomajiRow } from "../../../components/japanese";
import { PronounceButton } from "../../../components/audio/PronounceButton";
import { colors, spacing, typography } from "../../../theme";
import { useDisplayPrefs } from "../../../context/DisplayPrefsContext";
import type { WordWithProgress } from "../../../lib/types";

type Props = { word: WordWithProgress };

export function CardBack({ word }: Props) {
  const { showRomaji } = useDisplayPrefs();

  return (
    <View style={styles.wrap}>
      <JapaneseText text={word.kanji} size="lg" />
      {showRomaji ? <RomajiRow romaji={word.romaji} size="lg" /> : null}
      <Text style={styles.meaning}>{word.meaning_mn}</Text>
      {word.example_jp ? (
        <View style={styles.example}>
          <Text style={styles.exampleJp}>{word.example_jp}</Text>
          {showRomaji && word.example_romaji ? (
            <Text style={styles.exampleRomaji}>{word.example_romaji}</Text>
          ) : null}
          {word.example_mn ? (
            <Text style={styles.exampleMn}>{word.example_mn}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={{ marginTop: spacing.md }}>
        <PronounceButton wordId={word.id} meaningMn={word.meaning_mn} size="md" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    gap: spacing.sm,
  },
  meaning: {
    ...typography.heading.lg,
    color: colors.text.primary,
    textAlign: "center",
    marginVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    maxWidth: "100%",
    flexShrink: 1,
  },
  example: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    padding: spacing.md,
    width: "100%",
    maxWidth: "100%",
    gap: 4,
    marginTop: spacing.sm,
    flexShrink: 1,
  },
  exampleJp: {
    ...typography.heading.md,
    color: colors.text.primary,
    textAlign: "center",
    flexShrink: 1,
    maxWidth: "100%",
  },
  exampleRomaji: {
    ...typography.romaji.md,
    color: colors.text.secondary,
    textAlign: "center",
    flexShrink: 1,
    maxWidth: "100%",
  },
  exampleMn: {
    ...typography.body.md,
    color: colors.text.secondary,
    textAlign: "center",
    flexShrink: 1,
    maxWidth: "100%",
  },
});
