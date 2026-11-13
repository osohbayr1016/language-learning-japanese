import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { AdminStats } from '../../lib/api/admin';
import { mn } from '../../i18n/mn';
import { colors, radius, spacing, typography } from '../../theme';

type Props = { stats: AdminStats | null };

/** Always 2×2 — matches the phone-width admin column on web and native. */
export function AdminHubStatsStrip({ stats }: Props) {
  const router = useRouter();
  const a = mn.admin;

  if (!stats) {
    return (
      <View style={[styles.wrap, styles.loading]}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/admin/dashboard')}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={[styles.cell, styles.cellRight, styles.cellBottom]}>
          <Text style={styles.val}>{stats.users}</Text>
          <Text style={styles.lbl}>{a.hubStatsUsers}</Text>
        </View>
        <View style={[styles.cell, styles.cellBottom]}>
          <Text style={styles.val}>{stats.words}</Text>
          <Text style={styles.lbl}>{a.jlptColWords}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.cell, styles.cellRight]}>
          <Text style={styles.val}>{stats.lessons_total}</Text>
          <Text style={styles.lbl}>{a.jlptColLessons}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.val}>{stats.chapters_total}</Text>
          <Text style={styles.lbl}>{a.jlptColChapters}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const hair = StyleSheet.hairlineWidth;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  loading: { paddingVertical: spacing.lg, justifyContent: 'center' },
  pressed: { opacity: 0.92 },
  row: { flexDirection: 'row' },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  cellRight: { borderRightWidth: hair, borderColor: colors.border },
  cellBottom: { borderBottomWidth: hair, borderColor: colors.border },
  val: { ...typography.heading.sm, color: colors.text.primary, fontWeight: '800' },
  lbl: { ...typography.body.sm, color: colors.text.muted, marginTop: 2, fontSize: 11 },
});
