import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { api } from '../../lib/api';
import type { AdminChapter, AdminLesson } from '../../lib/api/admin';
import { useAuth } from '../../context/AuthContext';
import { adminNotify } from './adminNotify';
import { groupLessonTreeByJlpt } from './adminLessonTreeSections';
import { colors, radius, spacing, typography } from '../../theme';

export function AdminJlptLessonsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [tree, setTree] = useState<AdminChapter[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api.admin.lessonTree(token);
      setTree(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      adminNotify('Алдаа', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = useMemo(() => groupLessonTreeByJlpt(tree), [tree]);

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Нэвтэрсний дараа дахин оролдоно уу.</Text>
      </View>
    );
  }

  if (loading && sections.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(chapter) => `chapter-${chapter.id}`}
      refreshing={loading}
      onRefresh={() => void load()}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.list}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      renderItem={({ item: chapter }) => (
        <View style={styles.chapter}>
          <View style={styles.chapterHeader}>
            <Text style={styles.chapterTitle}>{chapter.title_mn}</Text>
            <Text style={styles.chapterState}>
              {chapter.is_published ? 'Нийтлэгдсэн' : 'Нуугдсан'}
            </Text>
          </View>

          {(chapter.lessons ?? [])
            .slice()
            .sort((a, b) => a.order_num - b.order_num)
            .map((lesson) => (
              <LessonAdminRow
                key={lesson.id}
                chapter={chapter}
                lesson={lesson}
                onPress={() => router.push(`/admin/lesson/${lesson.id}` as Href)}
              />
            ))}
        </View>
      )}
      ListEmptyComponent={
        loading ? null : <Text style={styles.empty}>JLPT хичээл олдсонгүй.</Text>
      }
    />
  );
}

function LessonAdminRow({
  chapter,
  lesson,
  onPress,
}: {
  chapter: AdminChapter;
  lesson: AdminLesson;
  onPress: () => void;
}) {
  const jlpt = Math.min(5, Math.max(1, Number(chapter.jlpt_level) || 1));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.lessonTitle}>{lesson.title_mn}</Text>
        <Text style={styles.meta}>
          #{lesson.id} · {lesson.word_count} үг · {lesson.is_published ? 'нийтлэгдсэн' : 'нуугдсан'}
        </Text>
      </View>
      <Text style={styles.badge}>N{6 - jlpt}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.bg.secondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    padding: spacing.lg,
  },
  muted: { ...typography.body.md, color: colors.text.muted },
  empty: {
    ...typography.body.md,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading.lg,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chapter: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chapterTitle: { ...typography.heading.md, color: colors.text.primary, flex: 1 },
  chapterState: { ...typography.body.sm, color: colors.text.muted },
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
  lessonTitle: { ...typography.body.md, fontWeight: '700', color: colors.text.primary },
  meta: { ...typography.body.sm, color: colors.text.muted, marginTop: 4 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    ...typography.body.sm,
    fontWeight: '800',
    color: colors.brand.primary,
    backgroundColor: colors.bg.elevated,
  },
});
