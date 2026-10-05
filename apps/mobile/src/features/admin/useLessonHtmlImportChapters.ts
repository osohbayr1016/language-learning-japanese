import { useCallback, useState } from 'react';
import { api } from '../../lib/api';
import type { AdminChapter } from '../../lib/api/admin';
import { colors } from '../../theme';
import { adminNotify } from './adminNotify';
import { firstSelectableChapterId } from './adminLessonHtmlChapterRows';

type JlptBand = 1 | 2 | 3 | 4 | 5;

function jlptLabel(band: JlptBand): string {
  return `JLPT N${6 - band}`;
}

export function useLessonHtmlImportChapters(token: string | null) {
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [creatingJlptBand, setCreatingJlptBand] = useState<number | null>(null);

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

  const ensureChapterForJlptBand = useCallback(
    async (requestedBand: number) => {
      if (!token) return;
      const band = Math.min(5, Math.max(1, requestedBand)) as JlptBand;
      setCreatingJlptBand(band);
      try {
        const maxOrder = chapters.reduce((m, c) => Math.max(m, c.order_num), 0);
        const res = await api.admin.createChapter(token, {
          title_mn: jlptLabel(band),
          subtitle_mn: 'HTML импорт',
          jlpt_level: band,
          color: colors.jlpt[band],
          order_num: maxOrder + 1,
        });
        await loadTree({ selectId: res.data.id });
      } catch (e) {
        adminNotify('Бүлэг үүсгэх', (e as Error).message);
      } finally {
        setCreatingJlptBand(null);
      }
    },
    [token, chapters, loadTree]
  );

  return {
    chapters,
    chapterId,
    setChapterId,
    creatingJlptBand,
    loadTree,
    ensureChapterForJlptBand,
  };
}
