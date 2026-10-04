import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../primitives';
import { colors, spacing, typography } from '../../theme';

type Props = {
  kind: 'error' | 'warning';
  title: string;
  message: string;
  onRetry?: () => void;
};

export function StudyDataStatusCard({ kind, title, message, onRetry }: Props) {
  const color = kind === 'error' ? colors.error : colors.warning;
  return (
    <Card padding="lg" style={styles.card}>
      <View style={styles.row}>
        <Ionicons
          name={kind === 'error' ? 'alert-circle-outline' : 'cloud-offline-outline'}
          size={24}
          color={color}
        />
        <View style={styles.copy}>
          <Text style={[styles.title, { color }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
      {onRetry ? (
        <Button
          label="Дахин оролдох"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={onRetry}
          style={styles.retry}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  copy: { flex: 1 },
  title: { ...typography.heading.sm },
  message: { ...typography.body.sm, color: colors.text.secondary, marginTop: 4 },
  retry: { marginTop: spacing.md, alignSelf: 'flex-start' },
});
