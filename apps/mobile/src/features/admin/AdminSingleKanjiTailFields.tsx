import React from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';

type Props = {
  jlpt: string;
  onJlptChange: (s: string) => void;
  textbookUnit: string;
  onTextbookUnit: (s: string) => void;
  rejectDup: boolean;
  onRejectDup: (v: boolean) => void;
};

export function AdminSingleKanjiTailFields({
  jlpt,
  onJlptChange,
  textbookUnit,
  onTextbookUnit,
  rejectDup,
  onRejectDup,
}: Props) {
  return (
    <>
      <Text style={styles.label}>JLPT түвшин (1=N5 … 5=N1)</Text>
      <TextInput value={jlpt} onChangeText={onJlptChange} style={styles.input} keyboardType="number-pad" />
      <Text style={styles.label}>{mn.admin.bulkTextbookUnit}</Text>
      <TextInput
        value={textbookUnit}
        onChangeText={onTextbookUnit}
        style={styles.input}
        placeholder="сонголттой"
        autoCapitalize="none"
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{mn.admin.rejectDuplicateWord}</Text>
        <Switch value={rejectDup} onValueChange={onRejectDup} />
      </View>
    </>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  switchLabel: { flex: 1, ...typography.body.sm, color: colors.text.secondary },
});
