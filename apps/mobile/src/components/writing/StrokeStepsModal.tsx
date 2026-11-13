import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KanjiWriterView } from './KanjiWriterView';
import { colors, radius, spacing, typography, shadows } from '../../theme';

type Props = {
  visible: boolean;
  char: string;
  mountKey: number;
  onClose: () => void;
};

export function StrokeStepsModal({ visible, char, mountKey, onClose }: Props) {
  const { width } = useWindowDimensions();
  const canvas = Math.min(Math.max(width - spacing.xl * 4, 200), 300);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet} pointerEvents="box-none">
          <View style={styles.card}>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Хаах"
              hitSlop={12}
            >
              <Ionicons name="close-circle" size={28} color={colors.text.secondary} />
            </Pressable>
            <Text style={styles.charTitle}>{char}</Text>
            {char ? (
              <View style={styles.writerWrap}>
                <KanjiWriterView
                  key={`${char}-${mountKey}`}
                  char={char}
                  mode="animate"
                  size={canvas}
                  strokeColor={colors.accent.purple}
                  outlineColor={colors.border}
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.xl + 8,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    ...shadows.md,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
  },
  charTitle: {
    ...typography.heading.xl,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  writerWrap: { alignItems: 'center' },
});
