export type ProgressResult = {
  word_id: number;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
  response_ms?: number;
  confidence?: number;
  /** When set (e.g. lesson complete), gates /api/words/due until this time. */
  flashcard_eligible_at?: string | null;
};

export function buildProgressStatements(db: D1Database, userId: number, results: ProgressResult[]) {
  return results.map((r) =>
    db.prepare(
      `INSERT INTO user_word_progress (
         user_id, word_id, ease_factor, interval, repetitions, next_review, last_reviewed,
         avg_response_ms, confidence_avg, flashcard_eligible_at
       )
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
       ON CONFLICT(user_id, word_id) DO UPDATE SET
         ease_factor = excluded.ease_factor,
         interval = excluded.interval,
         repetitions = excluded.repetitions,
         next_review = excluded.next_review,
         last_reviewed = CURRENT_TIMESTAMP,
         flashcard_eligible_at = COALESCE(excluded.flashcard_eligible_at, user_word_progress.flashcard_eligible_at),
         avg_response_ms = COALESCE(
           CASE WHEN excluded.avg_response_ms IS NULL THEN user_word_progress.avg_response_ms
                WHEN user_word_progress.avg_response_ms IS NULL THEN excluded.avg_response_ms
                ELSE (user_word_progress.avg_response_ms * 3 + excluded.avg_response_ms) / 4
           END,
           user_word_progress.avg_response_ms
         ),
         confidence_avg = COALESCE(
           CASE WHEN excluded.confidence_avg IS NULL THEN user_word_progress.confidence_avg
                WHEN user_word_progress.confidence_avg IS NULL THEN excluded.confidence_avg
                ELSE (user_word_progress.confidence_avg * 3 + excluded.confidence_avg) / 4.0
           END,
           user_word_progress.confidence_avg
         )`
    ).bind(
      userId, r.word_id, r.ease_factor, r.interval, r.repetitions, r.next_review,
      r.response_ms ?? null, r.confidence ?? null, r.flashcard_eligible_at ?? null
    )
  );
}

function dailyXpStatement(db: D1Database, userId: number, xp: number) {
  return db
    .prepare(
      `INSERT INTO user_daily_activity (user_id, activity_date, xp_earned)
       VALUES (?, date('now'), ?)
       ON CONFLICT(user_id, activity_date) DO UPDATE SET
         xp_earned = user_daily_activity.xp_earned + excluded.xp_earned,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(userId, Math.max(0, Math.floor(xp)));
}

export async function bumpStats(
  db: D1Database,
  userId: number,
  xp: number,
  reviewCount: number
): Promise<void> {
  const safeXp = Math.max(0, Math.floor(xp));
  await db.batch([
    db
      .prepare(
        `INSERT INTO user_stats (user_id, total_xp, total_reviews, words_learned, words_mastered)
         VALUES (
           ?,
           ?,
           ?,
           (SELECT COUNT(DISTINCT word_id) FROM user_word_progress
            WHERE user_id = ? AND repetitions >= 1),
           (SELECT COUNT(DISTINCT word_id) FROM user_word_progress
            WHERE user_id = ? AND repetitions >= 2)
         )
         ON CONFLICT(user_id) DO UPDATE SET
           total_xp = user_stats.total_xp + excluded.total_xp,
           total_reviews = user_stats.total_reviews + excluded.total_reviews,
           words_learned = excluded.words_learned,
           words_mastered = excluded.words_mastered`
      )
      .bind(userId, safeXp, reviewCount, userId, userId),
    dailyXpStatement(db, userId, safeXp),
  ]);
}

/** Game / misc XP: ensures a user_stats row exists (plain UPDATE can no-op if missing). */
export async function addXpToUserStats(db: D1Database, userId: number, xp: number): Promise<void> {
  const safeXp = Math.max(0, Math.floor(xp));
  if (safeXp <= 0) return;
  await db.batch([
    db
      .prepare(
        `INSERT INTO user_stats (user_id, total_xp) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET total_xp = user_stats.total_xp + excluded.total_xp`
      )
      .bind(userId, safeXp),
    dailyXpStatement(db, userId, safeXp),
  ]);
}
