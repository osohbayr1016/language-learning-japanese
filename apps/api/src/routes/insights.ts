import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import type { SkillKey } from '../lib/activity';
import { syncUserStatsAggregates } from '../lib/userStatsSync';

const insights = new Hono<{ Bindings: Env; Variables: Variables }>();

insights.use('*', authMiddleware);

const SKILL_KEYS: SkillKey[] = [
  'listening', 'pronunciation', 'pitch', 'recall', 'reading', 'stroke',
];

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

insights.get('/summary', async (c) => {
  const { sub } = c.get('user');
  await syncUserStatsAggregates(c.env.DB, sub);

  const [stats, streak] = await Promise.all([
    safe(
      c.env.DB.prepare(
        `SELECT total_xp, words_learned, words_mastered,
                lessons_completed, perfect_lessons, games_played
         FROM user_stats WHERE user_id = ?`
      ).bind(sub).first<{
        total_xp: number;
        words_learned: number;
        words_mastered: number;
        lessons_completed: number;
        perfect_lessons: number;
        games_played: number;
      }>(),
      null
    ),
    safe(
      c.env.DB.prepare(
        `SELECT current_streak, longest_streak, total_days_studied
         FROM user_streaks WHERE user_id = ?`
      ).bind(sub).first<{
        current_streak: number;
        longest_streak: number;
        total_days_studied: number;
      }>(),
      null
    ),
  ]);

  return c.json({
    data: {
      longest_streak: streak?.longest_streak ?? 0,
      current_streak: streak?.current_streak ?? 0,
      total_days_studied: streak?.total_days_studied ?? 0,
      lessons_completed: stats?.lessons_completed ?? 0,
      perfect_lessons: stats?.perfect_lessons ?? 0,
      words_learned: stats?.words_learned ?? 0,
      words_mastered: stats?.words_mastered ?? 0,
      games_played: stats?.games_played ?? 0,
      total_xp: stats?.total_xp ?? 0,
    },
  });
});

insights.get('/skills', async (c) => {
  const { sub } = c.get('user');
  const rows = await safe(
    c.env.DB.prepare(
      'SELECT skill, hits, total FROM user_skill_stats WHERE user_id = ?'
    ).bind(sub).all<{ skill: string; hits: number; total: number }>(),
    { results: [] as { skill: string; hits: number; total: number }[] } as never
  );

  const data: Record<SkillKey, { hits: number; total: number; ratio: number }> = {
    listening: { hits: 0, total: 0, ratio: 0 },
    pronunciation: { hits: 0, total: 0, ratio: 0 },
    pitch: { hits: 0, total: 0, ratio: 0 },
    recall: { hits: 0, total: 0, ratio: 0 },
    reading: { hits: 0, total: 0, ratio: 0 },
    stroke: { hits: 0, total: 0, ratio: 0 },
  };

  for (const row of rows.results ?? []) {
    const normalized = row.skill === 'tones' ? 'pitch' : row.skill;
    if (!SKILL_KEYS.includes(normalized as SkillKey)) continue;
    const key = normalized as SkillKey;
    const hits = data[key].hits + Number(row.hits ?? 0);
    const total = data[key].total + Number(row.total ?? 0);
    data[key] = {
      hits,
      total,
      ratio: total > 0 ? hits / total : 0,
    };
  }

  return c.json({ data });
});

insights.get('/calendar', async (c) => {
  const { sub } = c.get('user');
  const from = c.req.query('from');
  const to = c.req.query('to');
  if (!from || !to) return c.json({ error: 'from болон to шаардлагатай' }, 400);

  const rows = await safe(
    c.env.DB.prepare(
      `SELECT activity_date AS date, minutes_studied AS minutes, sessions_count AS sessions
       FROM user_daily_activity
       WHERE user_id = ? AND activity_date BETWEEN ? AND ?
       ORDER BY activity_date ASC`
    ).bind(sub, from, to).all(),
    { results: [] } as never
  );

  return c.json({ data: rows.results ?? [] });
});

insights.get('/time-spent', async (c) => {
  const { sub } = c.get('user');
  const end = c.req.query('end');
  if (!end) return c.json({ error: 'end шаардлагатай' }, 400);

  const rows = await safe(
    c.env.DB.prepare(
      `SELECT activity_date AS date, minutes_studied AS minutes
       FROM user_daily_activity
       WHERE user_id = ? AND activity_date BETWEEN date(?, '-6 days') AND ?
       ORDER BY activity_date ASC`
    ).bind(sub, end, end).all(),
    { results: [] } as never
  );

  return c.json({ data: rows.results ?? [] });
});

export default insights;
