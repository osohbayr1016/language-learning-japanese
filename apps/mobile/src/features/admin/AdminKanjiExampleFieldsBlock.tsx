import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { mn } from '../../i18n/mn';
import { colors, spacing, typography } from '../../theme';

type Props = {
  exampleJp: string;
  exampleRomaji: string;
  exampleMn: string;
  onExampleJp: (v: string) => void;
  onExampleRomaji: (v: string) => void;
  onExampleMn: (v: string) => void;
  showBulkHint?: boolean;
  disabled?: boolean;
};

export function AdminKanjiExampleFieldsBlock({
  exampleJp,
  exampleRomaji,
  exampleMn,
  onExampleJp,
  onExampleRomaji,
  onExampleMn,
  showBulkHint,
  disabled,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{mn.admin.wordExampleJp}</Text>
      {showBulkHint ? <Text style={styles.hint}>{mn.admin.bulkSharedExampleHint}</Text> : null}
      <TextInput
        style={styles.input}
        value={exampleJp}
        onChangeText={onExampleJp}
        placeholder="例：今日はいい天気です。"
        multiline
        editable={!disabled}
      />
      <Text style={styles.label}>{mn.admin.wordExampleRomaji}</Text>
      <TextInput
        style={styles.input}
        value={exampleRomaji}
        onChangeText={onExampleRomaji}
        autoCapitalize="none"
        editable={!disabled}
      />
      <Text style={styles.label}>{mn.admin.wordExampleMn}</Text>
      <TextInput
        style={styles.input}
        value={exampleMn}
        onChangeText={onExampleMn}
        multiline
        editable={!disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm, gap: spacing.xs },
  title: { ...typography.heading.sm, color: colors.text.primary },
  hint: { ...typography.body.sm, color: colors.text.muted, marginBottom: spacing.xs },
  label: { ...typography.body.sm, color: colors.text.secondary, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    color: colors.text.primary,
    backgroundColor: colors.bg.card,
    minHeight: 40,
  },
});
