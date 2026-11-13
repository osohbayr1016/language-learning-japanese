import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

type Props = {
  kanji: string;
  romaji: string;
  meaningMn: string;
  onKanji: (v: string) => void;
  onRomaji: (v: string) => void;
  onMeaningMn: (v: string) => void;
};

export function AdminKanjiCoreWordInputs({
  kanji,
  romaji,
  meaningMn,
  onKanji,
  onRomaji,
  onMeaningMn,
}: Props) {
  return (
    <View>
      <Text style={styles.label}>Канжи / кана (Үг эсвэл нэг бүлэг тэмдэгт)</Text>
      <TextInput value={kanji} onChangeText={onKanji} style={styles.input} />
      <Text style={styles.label}>Romaji</Text>
      <TextInput value={romaji} onChangeText={onRomaji} style={styles.input} autoCapitalize="none" />
      <Text style={styles.label}>Монгол утга</Text>
      <TextInput value={meaningMn} onChangeText={onMeaningMn} style={styles.input} multiline />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.body.sm, color: colors.text.secondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
    color: colors.text.primary,
    backgroundColor: colors.bg.card,
  },
});
