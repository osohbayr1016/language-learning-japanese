export type SkillKey =
  | 'listening'
  | 'pronunciation'
  | 'pitch'
  | 'recall'
  | 'reading'
  | 'stroke';

export type SkillCounts = { hits: number; total: number };
export type SkillResults = Partial<Record<SkillKey, SkillCounts>>;

export async function bumpDailyActivity(
  db: D1Database,
  userId: number,
  durationSec: number
): Promise<void> {
  const minutes = Math.max(0, Math.round(durationSec / 60));
  if (minutes === 0 && durationSec === 0) return;
  await db.prepare(
    `INSERT INTO user_daily_activity (user_id, activity_date, minutes_studied, sessions_count)
     VALUES (?, date('now'), ?, 1)
     ON CONFLICT(user_id, activity_date) DO UPDATE SET
       minutes_studied = user_daily_activity.minutes_studied + excluded.minutes_studied,
       sessions_count = user_daily_activity.sessions_count + 1,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(userId, minutes).run();
}

export async function bumpSkillStats(
  db: D1Database,
  userId: number,
  results: SkillResults
): Promise<void> {
  const stmts = [];
  for (const key of Object.keys(results) as SkillKey[]) {
    const r = results[key];
    if (!r || r.total <= 0) continue;
    stmts.push(
      db.prepare(
        `INSERT INTO user_skill_stats (user_id, skill, hits, total)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, skill) DO UPDATE SET
           hits = user_skill_stats.hits + excluded.hits,
           total = user_skill_stats.total + excluded.total,
           updated_at = CURRENT_TIMESTAMP`
      ).bind(userId, key, Math.max(0, r.hits), Math.max(0, r.total))
    );
  }
  if (stmts.length === 0) return;
  await db.batch(stmts);
}

export async function bumpLessonOutcome(
  db: D1Database,
  userId: number,
  isPerfect: boolean
): Promise<void> {
  await db.prepare('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)').bind(userId).run();
  await db
    .prepare(
      `UPDATE user_stats SET
         lessons_completed = lessons_completed + 1,
         perfect_lessons = perfect_lessons + ?
       WHERE user_id = ?`
    )
    .bind(isPerfect ? 1 : 0, userId)
    .run();
}

export async function bumpGamePlayed(db: D1Database, userId: number): Promise<void> {
  await db.prepare('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)').bind(userId).run();
  await db
    .prepare('UPDATE user_stats SET games_played = games_played + 1 WHERE user_id = ?')
    .bind(userId)
    .run();
}
