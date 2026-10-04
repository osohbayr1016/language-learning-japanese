export const LESSON_MASTERY_ACCURACY = 0.8;

/** Unlock JLPT N4+ when all published N5 lessons are mastered OR any published N5 mock is passed. */
export async function passesJlptN5AdvanceGate(db: D1Database, userId: number): Promise<boolean> {
  const mockPassRow = await db
    .prepare(
      `SELECT 1 AS ok FROM user_exam_sessions s
       JOIN exam_templates t ON t.id = s.template_id
       WHERE s.user_id = ? AND s.status = 'completed' AND s.passed = 1
         AND t.jlpt_level = 1 AND t.is_published = 1
       LIMIT 1`
    )
    .bind(userId)
    .first();
  if (mockPassRow) return true;

  const required = await db
    .prepare(
      `SELECT COUNT(*) AS n
       FROM lessons l
       JOIN chapters c ON c.id = l.chapter_id
       WHERE l.is_published = 1 AND c.is_published = 1 AND c.jlpt_level = 1`
    )
    .first<{ n?: number }>();

  const requiredCount = Number(required?.n ?? 0);
  if (requiredCount <= 0) return false;

  const mastered = await db
    .prepare(
      `SELECT COUNT(DISTINCT l.id) AS n
       FROM lessons l
       JOIN chapters c ON c.id = l.chapter_id
       JOIN user_lesson_progress p ON p.lesson_id = l.id
       WHERE p.user_id = ?
         AND l.is_published = 1
         AND c.is_published = 1
         AND c.jlpt_level = 1
         AND p.completed_at IS NOT NULL
         AND p.best_accuracy >= ?`
    )
    .bind(userId, LESSON_MASTERY_ACCURACY)
    .first<{ n?: number }>();

  return Number(mastered?.n ?? 0) >= requiredCount;
}

// Legacy alias for code that still uses old name.
export const passesHsk1AdvanceGate = passesJlptN5AdvanceGate;

export async function lessonChapterJlptLevel(
  db: D1Database,
  lessonId: number
): Promise<number | null> {
  const r = await db
    .prepare(
      `SELECT c.jlpt_level AS level FROM lessons l
       JOIN chapters c ON c.id = l.chapter_id
       WHERE l.id = ?`
    )
    .bind(lessonId)
    .first<{ level?: number }>();
  return r?.level == null ? null : Number(r.level);
}

// Legacy alias; remove after all old imports are migrated.
export const lessonChapterHskLevel = lessonChapterJlptLevel;
