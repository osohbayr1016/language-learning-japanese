import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { api } from '../../lib/api';
import type { AdminChapter, AdminLesson } from '../../lib/api/admin';
import { useAuth } from '../../context/AuthContext';
import { mn } from '../../i18n/mn';
import { adminNotify } from './adminNotify';
import { groupLessonTreeByJlpt } from './adminLessonTreeSections';
import { colors, radius, spacing, typography } from '../../theme';

export function AdminJlptN5LessonsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [tree, setTree] = useState<AdminChapter[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await api.admin.lessonTree(token);
      setTree(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      adminNotify('Алдаа', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const jlptN5Chapters = useMemo(() => {
    const sections = groupLessonTreeByJlpt(tree);
    const sec = sections.find((s) => s.title === 'JLPT N5');
    return sec?.data ?? [];
  }, [tree]);

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Нэвтэрнэ үү.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  if (jlptN5Chapters.length === 0) {
    return (
      <View style={styles.pad}>
        <Text style={styles.muted}>{mn.admin.jlptN5LessonsEmpty}</Text>
      </View>
    );
  }

  return (
    <View style={styles.pad}>
      {jlptN5Chapters.map((ch) => (
        <View key={ch.id} style={styles.chBlock}>
          <Text style={styles.chTitle}>{ch.title_mn}</Text>
          {(ch.lessons ?? [])
            .slice()
            .sort((a, b) => a.order_num - b.order_num)
            .map((ls) => (
              <LessonAdminRow key={ls.id} ch={ch} ls={ls} onPress={() => router.push(`/admin/lesson/${ls.id}` as Href)} />
            ))}
        </View>
      ))}
    </View>
  );
}

function LessonAdminRow({ ch, ls, onPress }: { ch: AdminChapter; ls: AdminLesson; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowMain}>
        <Text style={styles.lsTitle}>{ls.title_mn}</Text>
        <Text style={styles.meta}>
          #{ls.id} · {ls.word_count} үг · {ls.is_published ? 'нийтлэгдсэн' : 'нуугдсан'}
        </Text>
      </View>
      <Text style={[styles.badge, { backgroundColor: ch.color ? `${ch.color}22` : colors.bg.elevated }]}>
        JLPT N{6-ch.jlpt_level}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg, flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { ...typography.body.md, color: colors.text.muted },
  chBlock: { gap: spacing.sm },
  chTitle: { ...typography.heading.md, color: colors.text.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.primary,
    gap: spacing.sm,
  },
  rowPressed: { opacity: 0.9 },
  rowMain: { flex: 1, minWidth: 0 },
  lsTitle: { ...typography.body.md, fontWeight: '700', color: colors.text.primary },
  meta: { ...typography.body.sm, color: colors.text.muted, marginTop: 4 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    ...typography.body.sm,
    fontWeight: '700',
    color: colors.text.secondary,
  },
});
