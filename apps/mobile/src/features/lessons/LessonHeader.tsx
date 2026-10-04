import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { ProgressBar } from '../../primitives';
import { mn } from '../../i18n/mn';

type Props = {
  progress: number;
  onClose: () => void;
  onMore: () => void;
  onAdminEdit?: () => void;
};

export function LessonHeader({ progress, onClose, onMore, onAdminEdit }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Хичээлээс гарах"
        onPress={onClose}
        hitSlop={12}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={22} color={colors.text.secondary} />
      </Pressable>

      <View style={styles.barWrap}>
        <ProgressBar
          value={Math.max(0, Math.min(100, progress * 100))}
          color={colors.brand.primary}
          height={12}
          trackColor={colors.bg.elevated}
        />
      </View>

      {onAdminEdit ? (
        <Pressable
          onPress={onAdminEdit}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={mn.admin.lessonEdit}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Ionicons name="create-outline" size={21} color={colors.brand.primary} />
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Нэмэлт сонголт"
        onPress={onMore}
        hitSlop={12}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
      >
        <Ionicons name="ellipsis-horizontal" size={21} color={colors.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  barWrap: { flex: 1, paddingHorizontal: spacing.xs },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.94 }], opacity: 0.8 },
});
