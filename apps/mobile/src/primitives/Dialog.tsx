import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, radius, shadows, spacing, typography } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  confirmLabel?: string;
  /** Set false for dialogs that must be acknowledged explicitly. */
  dismissOnBackdrop?: boolean;
};

export function Dialog({
  visible,
  title,
  message,
  onClose,
  confirmLabel = 'Ойлголоо',
  dismissOnBackdrop = true,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Tapping outside is what people expect from a modal; without it the
            dialog felt stuck if the button was missed. */}
        {dismissOnBackdrop ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Хаах"
            accessibilityRole="button"
            onPress={onClose}
          />
        ) : null}
        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Button label={confirmLabel} onPress={onClose} style={styles.btn} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  title: {
    ...typography.heading.lg,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: { alignItems: 'center' },
  btn: { width: '100%' },
});
