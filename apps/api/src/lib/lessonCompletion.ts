import { buildProgressStatements, type ProgressResult } from './progress';
import { LESSON_MASTERY_ACCURACY } from './jlptGate';
import type { SkillKey, SkillResults } from './activity';

export type LessonCompletionBody = {
  completion_id?: string;
  accuracy: number;
  xp_earned?: number; // legacy client hint; server deliberately ignores this value.
  duration_seconds?: number;
  results?: ProgressResult[];
  skill_results?: SkillResults;
};

export type LessonCompletionResult = {
  lesson_id: number;
  completion_id: string;
  accuracy: number;
  xp_earned: number;
  mastered: boolean;
  mastery_required: number;
  already_applied: boolean;
};

const MAX_COMPLETION_ID = 120;
const MAX_LESSON_XP = 300;

export function lessonIsMastered(accuracy: number): boolean {
  return accuracy >= LESSON_MASTERY_ACCURACY;
}

export function calculateLessonXp(accuracy: number, lessonWordCount: number): number {
  const normalizedAccuracy = Math.max(0, Math.min(1, accuracy));
  const learningUnits = Math.max(1, Math.min(30, Math.floor(lessonWordCount)));
  return Math.min(MAX_LESSON_XP, Math.round(normalizedAccuracy * learningUnits * 10));
}

function normalizeCompletionId(raw?: string): string {
  const candidate = raw?.trim();
  if (candidate && candidate.length <= MAX_COMPLETION_ID && /^[A-Za-z0-9._:-]+$/.test(candidate)) {
    return candidate;
  }
  return `legacy-${crypto.randomUUID()}`;
}

function sanitizeProgress(
  rows: ProgressResult[],
  validWordIds: Set<number>
): ProgressResult[] {
  const deduped = new Map<number, ProgressResult>();
  for (const row of rows) {
    const wordId = Number(row.word_id);
    if (!Number.isInteger(wordId) || !validWordIds.has(wordId)) continue;

    const nextReview = new Date(row.next_review);
    if (!Number.isFinite(nextReview.getTime())) continue;

    deduped.set(wordId, {
      word_id: wordId,
      ease_factor: Math.max(1.3, Math.min(3.5, Number(row.ease_factor) || 2.5)),
      interval: Math.max(0, Math.min(3650, Math.floor(Number(row.interval) || 0))),
      repetitions: Math.max(0, Math.min(1000, Math.floor(Number(row.repetitions) || 0))),
      next_review: nextReview.toISOString(),
      response_ms:
        row.response_ms == null ? undefined : Math.max(0, Math.min(600000, Math.floor(row.response_ms))),
      confidence:
        row.confidence == null ? undefined : Math.max(0, Math.min(1, Number(row.confidence))),
      flashcard_eligible_at: row.flashcard_eligible_at ?? null,
    });
  }
  return [...deduped.values()];
}

function skillStatements(
  db: D1Database,
  userId: number,
  results: SkillResults | undefined
) {
  if (!results) return [];
  const statements = [];
  for (const key of Object.keys(results) as SkillKey[]) {
    const raw = results[key];
    if (!raw) continue;
    const total = Math.max(0, Math.min(500, Math.floor(Number(raw.total) || 0)));
    const hits = Math.max(0, Math.min(total, Math.floor(Number(raw.hits) || 0)));
    if (total === 0) continue;
    statements.push(
      db.prepare(
        `INSERT INTO user_skill_stats (user_id, skill, hits, total)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, skill) DO UPDATE SET
           hits = user_skill_stats.hits + excluded.hits,
           total = user_skill_stats.total + excluded.total,
           updated_at = CURRENT_TIMESTAMP`
      ).bind(userId, key, hits, total)
    );
  }
  return statements;
}

async function findExisting(
  db: D1Database,
  userId: number,
  completionId: string
): Promise<LessonCompletionResult | null> {
  const row = await db
    .prepare(
      `SELECT lesson_id, completion_id, accuracy, xp_earned, mastered
       FROM lesson_completion_events
       WHERE user_id = ? AND completion_id = ?`
    )
    .bind(userId, completionId)
    .first<{
      lesson_id: number;
      completion_id: string;
      accuracy: number;
      xp_earned: number;
      mastered: number;
    }>();

  if (!row) return null;
  return {
    lesson_id: Number(row.lesson_id),
    completion_id: row.completion_id,
    accuracy: Number(row.accuracy),
    xp_earned: Number(row.xp_earned),
    mastered: Number(row.mastered) === 1,
    mastery_required: LESSON_MASTERY_ACCURACY,
    already_applied: true,
  };
}

export async function applyLessonCompletion(
  db: D1Database,
  userId: number,
  lessonId: number,
  body: LessonCompletionBody,
  flashcardEligibleAt: string | null
): Promise<LessonCompletionResult> {
  const completionId = normalizeCompletionId(body.completion_id);
  const existing = await findExisting(db, userId, completionId);
  if (existing) return existing;

  const accuracy = Math.max(0, Math.min(1, Number(body.accuracy)));
  if (!Number.isFinite(accuracy)) throw new Error('INVALID_ACCURACY');

  const lessonWords = await db
    .prepare('SELECT word_id FROM lesson_words WHERE lesson_id = ? ORDER BY order_num ASC')
    .bind(lessonId)
    .all<{ word_id: number }>();
  const validWordIds = new Set((lessonWords.results ?? []).map((row) => Number(row.word_id)));
  const wordCount = validWordIds.size;
  const xp = calculateLessonXp(accuracy, wordCount);
  const mastered = lessonIsMastered(accuracy);
  const duration = Math.max(0, Math.min(86400, Math.floor(Number(body.duration_seconds) || 0)));
  const minutes = Math.max(0, Math.round(duration / 60));

  const sanitizedResults = sanitizeProgress(body.results ?? [], validWordIds).map((row) => ({
    ...row,
    flashcard_eligible_at: flashcardEligibleAt,
  }));

  const lessonProgress = db.prepare(
    `INSERT INTO user_lesson_progress (
       user_id, lesson_id, best_accuracy, attempts, completed_at, updated_at
     )
     VALUES (?, ?, ?, 1, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET
       best_accuracy = MAX(user_lesson_progress.best_accuracy, excluded.best_accuracy),
       attempts = user_lesson_progress.attempts + 1,
       completed_at = CASE
         WHEN user_lesson_progress.completed_at IS NOT NULL THEN user_lesson_progress.completed_at
         WHEN ? = 1 THEN CURRENT_TIMESTAMP
         ELSE NULL
       END,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(userId, lessonId, accuracy, mastered ? 1 : 0, mastered ? 1 : 0);

  const statsInsert = db
    .prepare('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)')
    .bind(userId);

  const statsUpdate = db.prepare(
    `UPDATE user_stats SET
       total_xp = total_xp + ?,
       total_reviews = total_reviews + ?,
       words_learned = (
         SELECT COUNT(DISTINCT word_id) FROM user_word_progress
         WHERE user_id = ? AND repetitions >= 1
       ),
       words_mastered = (
         SELECT COUNT(DISTINCT word_id) FROM user_word_progress
         WHERE user_id = ? AND repetitions >= 2
       ),
       lessons_completed = (
         SELECT COUNT(*) FROM user_lesson_progress
         WHERE user_id = ? AND completed_at IS NOT NULL
       ),
       perfect_lessons = (
         SELECT COUNT(*) FROM user_lesson_progress
         WHERE user_id = ? AND completed_at IS NOT NULL AND best_accuracy >= 0.95
       )
     WHERE user_id = ?`
  ).bind(
    xp,
    sanitizedResults.length,
    userId,
    userId,
    userId,
    userId,
    userId
  );

  const dailyXp = db.prepare(
    `INSERT INTO user_daily_activity (user_id, activity_date, minutes_studied, sessions_count, xp_earned)
     VALUES (?, date('now'), ?, 1, ?)
     ON CONFLICT(user_id, activity_date) DO UPDATE SET
       minutes_studied = user_daily_activity.minutes_studied + excluded.minutes_studied,
       sessions_count = user_daily_activity.sessions_count + 1,
       xp_earned = user_daily_activity.xp_earned + excluded.xp_earned,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(userId, minutes, xp);

  const streak = db.prepare(
    `INSERT INTO user_streaks (
       user_id, current_streak, longest_streak, last_activity_date, total_days_studied
     ) VALUES (?, 1, 1, date('now'), 1)
     ON CONFLICT(user_id) DO UPDATE SET
       current_streak = CASE
         WHEN user_streaks.last_activity_date = date('now') THEN user_streaks.current_streak
         WHEN user_streaks.last_activity_date = date('now', '-1 day') THEN user_streaks.current_streak + 1
         ELSE 1
       END,
       longest_streak = MAX(
         user_streaks.longest_streak,
         CASE
           WHEN user_streaks.last_activity_date = date('now') THEN user_streaks.current_streak
           WHEN user_streaks.last_activity_date = date('now', '-1 day') THEN user_streaks.current_streak + 1
           ELSE 1
         END
       ),
       total_days_studied = user_streaks.total_days_studied +
         CASE WHEN user_streaks.last_activity_date = date('now') THEN 0 ELSE 1 END,
       last_activity_date = date('now')`
  ).bind(userId);

  const event = db.prepare(
    `INSERT INTO lesson_completion_events (
       user_id, lesson_id, completion_id, accuracy, xp_earned, mastered
     ) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(userId, lessonId, completionId, accuracy, xp, mastered ? 1 : 0);

  try {
    await db.batch([
      event,
      lessonProgress,
      ...buildProgressStatements(db, userId, sanitizedResults),
      statsInsert,
      statsUpdate,
      dailyXp,
      ...skillStatements(db, userId, body.skill_results),
      streak,
    ]);
  } catch (error) {
    // A concurrent retry can lose the unique-key race. D1 batch is atomic;
    // if the winner committed, return its stored result instead of double-awarding.
    const raced = await findExisting(db, userId, completionId);
    if (raced) return raced;
    throw error;
  }

  return {
    lesson_id: lessonId,
    completion_id: completionId,
    accuracy,
    xp_earned: xp,
    mastered,
    mastery_required: LESSON_MASTERY_ACCURACY,
    already_applied: false,
  };
}
