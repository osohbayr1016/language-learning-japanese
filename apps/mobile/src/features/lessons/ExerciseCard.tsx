import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { MascotBubble } from './MascotBubble';

type Props = {
  title: string;
  prompt?: string;
  children: React.ReactNode;
};

export function ExerciseCard({ title, prompt, children }: Props) {
  return (
    <View style={styles.shell}>
      <Text style={styles.title}>{title}</Text>
      {prompt ? <MascotBubble message={prompt} /> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.overline,
    color: colors.brand.primary,
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
    minHeight: 0,
    marginTop: spacing.md,
  },
});
