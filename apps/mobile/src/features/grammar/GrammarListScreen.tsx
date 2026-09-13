import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { safeBack } from '../../lib/navigation/safeBack';
import { EmptyState, Screen } from '../../primitives';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { GrammarRow } from '../../lib/api/grammar';
import { mn } from '../../i18n/mn';
import { colors, radius, spacing, typography } from '../../theme';

export function GrammarListScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [rows, setRows] = useState<GrammarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setLoading(true);
    void (async () => {
      if (!token) {
        setRows([]);
        setLoading(false);
        return;
      }
      try {
        const r = await api.grammar.list(token);
        if (!cancelled) setRows(r.data ?? []);
      } catch {
        if (!cancelled) {
          setRows([]);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

  return (
    <Screen edges={['top']} scroll scrollBottomInset={88}>
      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mn.common.back}
          onPress={() => safeBack(router, '/(tabs)/study')}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.header} numberOfLines={1}>
          {mn.study.grammarTitle}
        </Text>
        <View style={styles.backBtn} />
      </View>
      {!token ? (
        <EmptyState
          icon="log-in-outline"
          title={mn.auth.loginTitle}
          body="Грамматикийн хичээлүүд бүртгэлтэй хэрэглэгчид нээлттэй."
          actionLabel={mn.auth.signIn}
          onAction={() => router.push('/login' as never)}
        />
      ) : loading ? (
        <ActivityIndicator style={styles.center} color={colors.brand.primary} />
      ) : failed ? (
        <EmptyState
          icon="cloud-offline-outline"
          tone="warning"
          title="Ачаалж чадсангүй"
          body="Интернэт холболтоо шалгаад дахин оролдоно уу."
          actionLabel="Дахин оролдох"
          onAction={() => setAttempt((n) => n + 1)}
          secondaryLabel={mn.common.back}
          onSecondary={() => safeBack(router, '/(tabs)/study')}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="book-outline"
          tone="neutral"
          title="Грамматикийн хичээл алга"
          body="Хичээлүүд нэмэгдэхээр энд харагдана. Одоохондоо үг хэллэгээ давтаарай."
          actionLabel={mn.tabs.study}
          onAction={() => safeBack(router, '/(tabs)/study')}
        />
      ) : (
        <View style={styles.list}>
          {rows.map((g) => (
            <Pressable
              key={g.id}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(`/study/grammar/${g.id}` as never)}
            >
              <View>
                <Text style={styles.title} numberOfLines={2}>
                  {g.title_mn}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {g.exercise_count} дасгал
                  {typeof g.best_accuracy === 'number'
                    ? ` · ${Math.round((g.best_accuracy ?? 0) * 100)}%`
                    : ''}
                </Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: { opacity: 0.7 },
  header: {
    flex: 1,
    ...typography.heading.lg,
    color: colors.text.primary,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  hint: { ...typography.body.md, color: colors.text.secondary },
  center: { marginVertical: spacing.xl },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressed: { opacity: 0.92 },
  title: { ...typography.heading.sm, color: colors.text.primary },
  meta: { ...typography.body.sm, color: colors.text.secondary, marginTop: 4 },
  chev: { fontSize: 22, color: colors.text.muted },
});
