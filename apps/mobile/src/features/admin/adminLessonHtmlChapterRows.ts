import type { AdminChapter } from '../../lib/api/admin';

const JLPT_LEVELS = [1, 2, 3, 4, 5] as const;

export type ChapterPickRow =
  | { type: 'chapter'; chapter: AdminChapter }
  | { type: 'missing'; jlpt: number };

/** One row per JLPT 1–5: real chapter chips or a placeholder when no chapter exists for that level. */
export function buildChapterPickRows(chapters: AdminChapter[]): ChapterPickRow[] {
  return JLPT_LEVELS.flatMap<ChapterPickRow>((jlpt) => {
    const list = chapters
      .filter((c) => c.jlpt_level === jlpt)
      .slice()
      .sort((a, b) => a.order_num - b.order_num || a.id - b.id);
    if (!list.length) return [{ type: 'missing' as const, jlpt }];
    return list.map((chapter) => ({ type: 'chapter' as const, chapter }));
  });
}

export function firstSelectableChapterId(chapters: AdminChapter[]): number | null {
  const rows = buildChapterPickRows(chapters);
  const first = rows.find((r): r is Extract<ChapterPickRow, { type: 'chapter' }> => r.type === 'chapter');
  return first?.chapter.id ?? null;
}
