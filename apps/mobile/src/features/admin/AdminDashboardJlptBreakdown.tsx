import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AdminStats } from '../../lib/api/admin';
import { mn } from '../../i18n/mn';
import { colors, spacing, typography } from '../../theme';

const LEVELS = ['1', '2', '3', '4', '5'] as const;

function jlptBandLabel(lvl: string): string {
  const n = Number(lvl);
  if (n >= 1 && n <= 5) return `N${6 - n}`;
  return lvl;
}

function pick(map: Record<string, number>, k: string): number {
  return map[k] ?? 0;
}

type Props = { stats: AdminStats };

export function AdminDashboardJlptBreakdown({ stats }: Props) {
  const a = mn.admin;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{a.jlptBreakdownTitle}</Text>
      <View style={styles.head}>
        <Text style={[styles.cell, styles.h]}>JLPT</Text>
        <Text style={styles.cell}>{a.jlptColWords}</Text>
        <Text style={styles.cell}>{a.jlptColChapters}</Text>
        <Text style={styles.cell}>{a.jlptColLessons}</Text>
      </View>
      {LEVELS.map((lvl) => (
        <View key={lvl} style={styles.row}>
          <Text style={[styles.cell, styles.h]}>{jlptBandLabel(lvl)}</Text>
          <Text style={styles.cell}>{pick(stats.words_by_jlpt, lvl)}</Text>
          <Text style={styles.cell}>{pick(stats.chapters_by_jlpt, lvl)}</Text>
          <Text style={styles.cell}>{pick(stats.lessons_by_jlpt, lvl)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  title: { ...typography.heading.sm, color: colors.text.primary, marginBottom: spacing.xs },
  head: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.xs },
  row: { flexDirection: 'row', paddingVertical: 4 },
  cell: { flex: 1, ...typography.body.sm, color: colors.text.secondary, textAlign: 'center' },
  h: { fontWeight: '700', color: colors.text.primary },
});
