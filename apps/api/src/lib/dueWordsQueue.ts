/**
 * GET /api/words/due — overdue SRS first, then new words from completed + next preview
 * lessons (lesson_words order), capped by path JLPT band, then global fallback.
 */

import { pickFreshFromLessons } from './dueWordsPickFresh';

const PREVIEW_LESSON_COUNT = 2;
const FALLBACK_JLPT_CAP = 3;

export type DueQueueOptions = { writerOnly?: boolean };

type LessonRow = { id: number; jlpt_level: number };

function writerClause(writerOnly: boolean): string {
  return writerOnly ? ' AND LENGTH(w.kanji) <= 3' : '';
}

export async function fetchDueWordsQueue(
  db: D1Database,
  userId: number,
  limit: number,
  opts: DueQueueOptions = {}
): Promise<Record<string, unknown>[]> {
  const writerOnly = opts.writerOnly ?? false;
  const wCh = writerClause(writerOnly);

  const overdueR = await db
    .prepare(
      `SELECT w.*, uwp.ease_factor, uwp.interval, uwp.repetitions, uwp.next_review
       FROM user_word_progress uwp JOIN words w ON uwp.word_id = w.id
       WHERE uwp.user_id = ? AND datetime(uwp.next_review) <= datetime('now')
         AND (uwp.flashcard_eligible_at IS NULL OR datetime(uwp.flashcard_eligible_at) <= datetime('now'))${wCh}
       ORDER BY datetime(uwp.next_review) ASC LIMIT ?`
    )
    .bind(userId, limit)
    .all();

  const overdueRows = (overdueR.results ?? []) as Record<string, unknown>[];
  if (overdueRows.length >= limit) return overdueRows.slice(0, limit);

  const seen = new Set(overdueRows.map((r) => r.id as number));
  const need = limit - overdueRows.length;

  const ordered = (
    await db
      .prepare(
        `SELECT l.id, c.jlpt_level AS jlpt_level
         FROM lessons l JOIN chapters c ON c.id = l.chapter_id
         WHERE l.is_published = 1 AND c.is_published = 1
         ORDER BY c.order_num ASC, l.order_num ASC`
      )
      .all()
  ).results as LessonRow[] | undefined;

  const path = ordered ?? [];
  const compR = await db
    .prepare(
      `SELECT lesson_id FROM user_lesson_progress
       WHERE user_id = ? AND completed_at IS NOT NULL`
    )
    .bind(userId)
    .all();
  const done = new Set((compR.results ?? []).map((x) => (x as { lesson_id: number }).lesson_id));

  const firstIncomplete = path.findIndex((l) => !done.has(l.id));
  const fi = firstIncomplete === -1 ? path.length : firstIncomplete;
  const previewIds = path.slice(fi, fi + PREVIEW_LESSON_COUNT).map((l) => l.id);

  /** Max JLPT band among completed + preview lessons; if none (empty catalog), allow fallback cap. */
  let maxJlpt = 1;
  let anyScope = false;
  for (const l of path) {
    if (done.has(l.id) || previewIds.includes(l.id)) {
      anyScope = true;
      maxJlpt = Math.max(maxJlpt, l.jlpt_level);
    }
  }
  if (!anyScope) maxJlpt = FALLBACK_JLPT_CAP;

  const wordLessonOrder: number[] = [];
  for (const l of path) {
    if (done.has(l.id)) wordLessonOrder.push(l.id);
  }
  for (const l of path) {
    if (previewIds.includes(l.id) && !done.has(l.id)) wordLessonOrder.push(l.id);
  }

  const inProgR = await db
    .prepare('SELECT word_id FROM user_word_progress WHERE user_id = ?')
    .bind(userId)
    .all();
  const inProgress = new Set((inProgR.results ?? []).map((x) => (x as { word_id: number }).word_id));

  const freshRows = await pickFreshFromLessons(
    db,
    wordLessonOrder,
    need,
    seen,
    inProgress,
    maxJlpt,
    wCh
  );

  let out = [...overdueRows, ...freshRows];
  if (out.length >= limit) return out.slice(0, limit);

  const fallNeed = limit - out.length;
  const fall = await db
    .prepare(
      `SELECT w.*, NULL AS ease_factor, 0 AS interval, 0 AS repetitions, NULL AS next_review
       FROM words w
       WHERE w.id NOT IN (SELECT word_id FROM user_word_progress WHERE user_id = ?)
         AND w.jlpt_level <= ?${wCh}
       ORDER BY w.jlpt_level ASC, w.id ASC
       LIMIT ?`
    )
    .bind(userId, maxJlpt, fallNeed + seen.size + 40)
    .all();

  for (const row of fall.results ?? []) {
    if (out.length >= limit) break;
    const id = (row as { id: number }).id;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(row as Record<string, unknown>);
  }

  return out.slice(0, limit);
}
