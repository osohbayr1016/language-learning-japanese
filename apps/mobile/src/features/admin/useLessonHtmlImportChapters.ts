import { useCallback, useState } from 'react';
import { api } from '../../lib/api';
import type { AdminChapter } from '../../lib/api/admin';
import { colors } from '../../theme';
import { adminNotify } from './adminNotify';
import { firstSelectableChapterId } from './adminLessonHtmlChapterRows';

export function useLessonHtmlImportChapters(token: string | null) {
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [creatingJlpt, setCreatingJlpt] = useState<number | null>(null);

  const loadTree = useCallback(
    async (opts?: { selectId?: number }) => {
      if (!token) return;
      const r = await api.admin.lessonTree(token);
      const list = Array.isArray(r.data) ? r.data : [];
      setChapters(list);
      setChapterId((old) => {
        const want = opts?.selectId;
        if (want != null && list.some((c) => c.id === want)) return want;
        if (old != null && list.some((c) => c.id === old)) return old;
        return firstSelectableChapterId(list);
      });
    },
    [token]
  );

  const ensureChapterForJlpt = useCallback(
    async (jlpt: number) => {
      if (!token) return;
      setCreatingJlpt(jlpt);
      try {
        const maxOrder = chapters.reduce((m, c) => Math.max(m, c.order_num), 0);
        const k = Math.min(5, Math.max(1, jlpt)) as 1 | 2 | 3 | 4 | 5;
        const res = await api.admin.createChapter(token, {
          title_mn: `JLPT N${6-jlpt}`,
          subtitle_mn: 'HTML импорт',
          jlpt_level: jlpt,
          color: colors.jlpt[k],
          order_num: maxOrder + 1,
        });
        await loadTree({ selectId: res.data.id });
      } catch (e) {
        adminNotify('Бүлэг үүсгэх', (e as Error).message);
      } finally {
        setCreatingJlpt(null);
      }
    },
    [token, chapters, loadTree]
  );

  return {
    chapters,
    chapterId,
    setChapterId,
    creatingJlpt,
    loadTree,
    ensureChapterForJlpt,
  };
}
