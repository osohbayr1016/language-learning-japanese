import type { AdminChapter } from '../../lib/api/admin';

export type LessonTreeSection = { title: string; data: AdminChapter[] };

/** Groups chapters by `jlpt_level` (1–5); sections ordered by JLPT; chapters sorted by `order_num`. */
export function groupLessonTreeByJlpt(tree: AdminChapter[]): LessonTreeSection[] {
  const map = new Map<number, AdminChapter[]>();
  for (const ch of tree) {
    const lvl = Math.min(5, Math.max(1, Number(ch.jlpt_level) || 1));
    const arr = map.get(lvl) ?? [];
    arr.push(ch);
    map.set(lvl, arr);
  }
  const out: LessonTreeSection[] = [];
  for (let jlpt = 1; jlpt <= 5; jlpt++) {
    const list = map.get(jlpt);
    if (!list?.length) continue;
    list.sort((a, b) => a.order_num - b.order_num);
    out.push({ title: `JLPT N${6-jlpt}`, data: list });
  }
  return out;
}

export function lessonCount(ch: AdminChapter): number {
  return ch.lessons?.length ?? 0;
}
