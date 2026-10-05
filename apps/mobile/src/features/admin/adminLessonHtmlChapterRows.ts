import type { AdminChapter } from '../../lib/api/admin';

const JLPT_BANDS = [1, 2, 3, 4, 5] as const;

export type ChapterPickRow =
  | { type: 'chapter'; chapter: AdminChapter }
  | { type: 'missing'; jlptBand: number };

/** One row per persisted JLPT band: 1=N5 through 5=N1. */
export function buildChapterPickRows(chapters: AdminChapter[]): ChapterPickRow[] {
  const rows: ChapterPickRow[] = [];

  for (const jlptBand of JLPT_BANDS) {
    const list = chapters
      .filter((c) => c.jlpt_level === jlptBand)
      .slice()
      .sort((a, b) => a.order_num - b.order_num || a.id - b.id);

    if (!list.length) {
      rows.push({ type: 'missing', jlptBand });
      continue;
    }

    for (const chapter of list) rows.push({ type: 'chapter', chapter });
  }

  return rows;
}

export function firstSelectableChapterId(chapters: AdminChapter[]): number | null {
  const first = buildChapterPickRows(chapters).find(
    (row): row is Extract<ChapterPickRow, { type: 'chapter' }> => row.type === 'chapter'
  );
  return first?.chapter.id ?? null;
}
