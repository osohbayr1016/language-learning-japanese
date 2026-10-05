import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import type { AdminChapter } from '../../lib/api/admin';
import { useAuth } from '../../context/AuthContext';
import { mn } from '../../i18n/mn';
import { adminNotify } from './adminNotify';
import { groupLessonTreeByJlpt } from './adminLessonTreeSections';
import { AdminLearningPathChapterBlock } from './AdminLearningPathChapterBlock';
import { learningPathStyles as styles } from './AdminLearningPathStyles';

export function AdminLearningPathScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [tree, setTree] = useState<AdminChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftTitle, setDraftTitle] = useState<Record<number, string>>({});

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

  const sections = useMemo(() => groupLessonTreeByJlpt(tree), [tree]);

  const saveDelay = async (ch: AdminChapter, raw: string) => {
    if (!token) return;
    const days = Math.min(365, Math.max(0, Math.floor(Number(raw) || 0)));
    try {
      await api.admin.patchChapter(token, ch.id, { flashcard_delay_days: days });
      await load();
    } catch (e) {
      adminNotify('Алдаа', (e as Error).message);
    }
  };

  const toggleChapterPub = async (ch: AdminChapter) => {
    if (!token) return;
    try {
      await api.admin.patchChapter(token, ch.id, { is_published: ch.is_published ? 0 : 1 });
      await load();
    } catch (e) {
      adminNotify('Алдаа', (e as Error).message);
    }
  };

  const addLesson = async (chapterId: number) => {
    const title = draftTitle[chapterId]?.trim();
    if (!title || !token) return;
    try {
      await api.admin.createLesson(token, { chapter_id: chapterId, title_mn: title });
      setDraftTitle((d) => ({ ...d, [chapterId]: '' }));
      await load();
    } catch (e) {
      adminNotify('Алдаа', (e as Error).message);
    }
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(ch) => `c-${ch.id}`}
      stickySectionHeadersEnabled={false}
      refreshing={loading}
      onRefresh={() => void load()}
      contentContainerStyle={styles.listPad}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.sectionHdr}>{title}</Text>
      )}
      renderItem={({ item: ch }) => (
        <AdminLearningPathChapterBlock
          ch={ch}
          draftTitle={draftTitle[ch.id] ?? ''}
          onDraftTitle={(t) => setDraftTitle((d) => ({ ...d, [ch.id]: t }))}
          onSaveDelay={(raw) => void saveDelay(ch, raw)}
          onTogglePublish={() => void toggleChapterPub(ch)}
          onAddLesson={() => void addLesson(ch.id)}
          onOpenLesson={(href) => router.push(href)}
          onPreviewLesson={(lessonId) => router.push(`/admin/lesson-preview/${lessonId}` as never)}
        />
      )}
      ListEmptyComponent={
        loading ? null : (
          <View style={{ gap: 8 }}>
            <Text style={styles.muted}>Хоосон</Text>
            <Text style={styles.muted}>{mn.admin.pathEmptyHint}</Text>
          </View>
        )
      }
    />
  );
}
