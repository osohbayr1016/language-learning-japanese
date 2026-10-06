import type { AdminChapter } from '../../lib/api/admin';

export type LessonTreeSection = { title: string; data: AdminChapter[] };

function jlptLabel(level: number): string {
  const safe = Math.min(5, Math.max(1, Number(level) || 1));
  return `JLPT N${6 - safe}`;
}

/** Groups chapters by the persisted JLPT band (1=N5 ... 5=N1). */
export function groupLessonTreeByJlpt(tree: AdminChapter[]): LessonTreeSection[] {
  const map = new Map<number, AdminChapter[]>();
  for (const ch of tree) {
    const level = Math.min(5, Math.max(1, Number(ch.jlpt_level) || 1));
    const list = map.get(level) ?? [];
    list.push(ch);
    map.set(level, list);
  }

  const out: LessonTreeSection[] = [];
  for (let level = 1; level <= 5; level += 1) {
    const list = map.get(level);
    if (!list?.length) continue;
    list.sort((a, b) => a.order_num - b.order_num);
    out.push({ title: jlptLabel(level), data: list });
  }
  return out;
}

/** @deprecated Compatibility alias for old imports. Use groupLessonTreeByJlpt. */
export const groupLessonTreeByHsk = groupLessonTreeByJlpt;

export function lessonCount(ch: AdminChapter): number {
  return ch.lessons?.length ?? 0;
}
