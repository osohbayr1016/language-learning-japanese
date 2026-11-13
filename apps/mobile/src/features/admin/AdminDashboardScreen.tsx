import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../lib/api';
import type { AdminStats } from '../../lib/api/admin';
import { useAuth } from '../../context/AuthContext';
import { mn } from '../../i18n/mn';
import { colors, spacing, typography } from '../../theme';
import { AdminDashboardJlptBreakdown } from './AdminDashboardJlptBreakdown';

export function AdminDashboardScreen() {
  const { token } = useAuth();
  const [s, setS] = useState<AdminStats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const a = mn.admin;

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    try {
      const r = await api.admin.stats(token);
      setS(r.data ?? null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err}</Text>
      </View>
    );
  }

  if (!s) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.intro}>{a.dashScreenIntro}</Text>
      <Text style={styles.extra}>
        {a.tileLessonWordLinks}: {s.lesson_word_links} · {a.tileDistinctKanji}: {s.distinct_kanji} · Дуусгалт:{' '}
        {s.lesson_completions} ({s.lesson_completions_last_7_days} / 7 хоног) · Кино: {s.cartoons}
      </Text>
      <AdminDashboardJlptBreakdown stats={s} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.bg.primary,
    paddingBottom: spacing.xxl,
  },
  intro: { ...typography.body.md, color: colors.text.secondary, lineHeight: 22 },
  extra: { ...typography.body.sm, color: colors.text.muted, lineHeight: 20 },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.bg.primary },
  err: { ...typography.body.md, color: colors.error },
});
