export type JlptSelfLevel = 'none' | 'n5' | 'n4' | 'n3' | 'n2' | 'n1';
export type LearningReason = 'university' | 'career' | 'travel' | 'culture' | 'fun';

export type LearningPreferences = {
  self_level: JlptSelfLevel | null;
  learning_reason: LearningReason | null;
  daily_xp_goal: number;
  kana_foundation_completed: boolean;
  placement_level: Exclude<JlptSelfLevel, 'none'> | null;
  placement_completed_at: string | null;
};

export type LearningPreferencesPatch = Partial<{
  self_level: JlptSelfLevel | null;
  learning_reason: LearningReason | null;
  daily_xp_goal: number;
  kana_foundation_completed: boolean;
}>;

const LEVELS = new Set<JlptSelfLevel>(['none', 'n5', 'n4', 'n3', 'n2', 'n1']);
const REASONS = new Set<LearningReason>(['university', 'career', 'travel', 'culture', 'fun']);

export function validateLearningPreferencesPatch(
  body: LearningPreferencesPatch
): string | null {
  if ('self_level' in body && body.self_level !== null && !LEVELS.has(body.self_level as JlptSelfLevel)) {
    return 'JLPT түвшин буруу байна';
  }
  if (
    'learning_reason' in body &&
    body.learning_reason !== null &&
    !REASONS.has(body.learning_reason as LearningReason)
  ) {
    return 'Сурах зорилго буруу байна';
  }
  if ('daily_xp_goal' in body) {
    const goal = Number(body.daily_xp_goal);
    if (!Number.isInteger(goal) || goal < 10 || goal > 200) {
      return 'Өдрийн XP зорилго 10–200 хооронд бүхэл тоо байна';
    }
  }
  if ('kana_foundation_completed' in body && typeof body.kana_foundation_completed !== 'boolean') {
    return 'Кана суурийн төлөв boolean байна';
  }
  return null;
}

export async function getLearningPreferences(
  db: D1Database,
  userId: number
): Promise<LearningPreferences> {
  const row = await db
    .prepare(
      `SELECT self_level, learning_reason, daily_xp_goal,
              kana_foundation_completed, placement_level, placement_completed_at
       FROM user_learning_preferences WHERE user_id = ?`
    )
    .bind(userId)
    .first<{
      self_level?: JlptSelfLevel | null;
      learning_reason?: LearningReason | null;
      daily_xp_goal?: number | null;
      kana_foundation_completed?: number | null;
      placement_level?: Exclude<JlptSelfLevel, 'none'> | null;
      placement_completed_at?: string | null;
    }>();

  return {
    self_level: row?.self_level ?? null,
    learning_reason: row?.learning_reason ?? null,
    daily_xp_goal: Number(row?.daily_xp_goal ?? 30),
    kana_foundation_completed: Number(row?.kana_foundation_completed ?? 0) === 1,
    placement_level: row?.placement_level ?? null,
    placement_completed_at: row?.placement_completed_at ?? null,
  };
}

export async function updateLearningPreferences(
  db: D1Database,
  userId: number,
  patch: LearningPreferencesPatch
): Promise<LearningPreferences> {
  const current = await getLearningPreferences(db, userId);
  const next = {
    self_level: patch.self_level !== undefined ? patch.self_level : current.self_level,
    learning_reason:
      patch.learning_reason !== undefined ? patch.learning_reason : current.learning_reason,
    daily_xp_goal:
      patch.daily_xp_goal !== undefined ? patch.daily_xp_goal : current.daily_xp_goal,
    kana_foundation_completed:
      patch.kana_foundation_completed !== undefined
        ? patch.kana_foundation_completed
        : current.kana_foundation_completed,
  };

  await db
    .prepare(
      `INSERT INTO user_learning_preferences (
         user_id, self_level, learning_reason, daily_xp_goal, kana_foundation_completed, updated_at
       ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         self_level = excluded.self_level,
         learning_reason = excluded.learning_reason,
         daily_xp_goal = excluded.daily_xp_goal,
         kana_foundation_completed = excluded.kana_foundation_completed,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      userId,
      next.self_level,
      next.learning_reason,
      next.daily_xp_goal,
      next.kana_foundation_completed ? 1 : 0
    )
    .run();

  return getLearningPreferences(db, userId);
}
