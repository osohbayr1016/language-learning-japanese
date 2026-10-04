import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import { updateStreak } from '../lib/streak';
import { syncUserStatsAggregates } from '../lib/userStatsSync';
import { buildProgressStatements, bumpStats, type ProgressResult } from '../lib/progress';
import { studyQueueCount } from '../lib/studyQueue';
import userVocabularyRoutes from './userVocabulary';
import { jsonBodyInvalid, readJsonBody } from '../lib/requestJson';
import { getStudyNextAction } from '../lib/studyRecommendation';

const user = new Hono<{ Bindings: Env; Variables: Variables }>();

user.use('*', authMiddleware);
user.route('/vocabulary', userVocabularyRoutes);

user.get('/profile', async (c) => {
  const { sub } = c.get('user');
  const profile = await c.env.DB.prepare(
    'SELECT id, email, display_name, avatar_url, created_at, is_admin FROM users WHERE id = ?'
  ).bind(sub).first();
  if (!profile) return c.json({ error: 'Хэрэглэгч олдсонгүй' }, 404);
  return c.json({ data: profile });
});

user.put('/profile', async (c) => {
  const { sub } = c.get('user');
  const body = await readJsonBody<{ display_name?: string; avatar_url?: string }>(c);
  if (!body) return jsonBodyInvalid(c);
  await c.env.DB.prepare(
    `UPDATE users SET display_name = COALESCE(?, display_name),
     avatar_url = COALESCE(?, avatar_url), updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(body.display_name ?? null, body.avatar_url ?? null, sub).run();
  return c.json({ message: 'Профайл шинэчлэгдлээ' });
});

user.get('/streak', async (c) => {
  const { sub } = c.get('user');
  const streak = await c.env.DB.prepare('SELECT * FROM user_streaks WHERE user_id = ?')
    .bind(sub).first();
  return c.json({ data: streak });
});

user.get('/stats', async (c) => {
  const { sub } = c.get('user');
  const stats = await c.env.DB.prepare('SELECT * FROM user_stats WHERE user_id = ?')
    .bind(sub).first();
  return c.json({ data: stats });
});

user.get('/dashboard', async (c) => {
  const { sub } = c.get('user');
  await syncUserStatsAggregates(c.env.DB, sub);
  const [profile, streakRaw, statsRaw, dueToday, todayActivity] = await Promise.all([
    c.env.DB.prepare(
      'SELECT id, email, display_name, avatar_url FROM users WHERE id = ?'
    ).bind(sub).first(),
    c.env.DB.prepare('SELECT * FROM user_streaks WHERE user_id = ?').bind(sub).first(),
    c.env.DB.prepare('SELECT * FROM user_stats WHERE user_id = ?').bind(sub).first(),
    studyQueueCount(c.env.DB, sub),
    c.env.DB
      .prepare(`SELECT xp_earned FROM user_daily_activity WHERE user_id = ? AND activity_date = date('now')`)
      .bind(sub)
      .first<{ xp_earned?: number }>(),
  ]);

  const streak = streakRaw
    ? {
        current_streak: Number(streakRaw.current_streak ?? 0),
        longest_streak: Number(streakRaw.longest_streak ?? 0),
        last_activity_date: streakRaw.last_activity_date ?? null,
        total_days_studied: Number(streakRaw.total_days_studied ?? 0),
      }
    : null;

  const stats = statsRaw
    ? {
        total_xp: Number(statsRaw.total_xp ?? 0),
        words_learned: Number(statsRaw.words_learned ?? 0),
        words_mastered: Number(statsRaw.words_mastered ?? 0),
        total_reviews: Number(statsRaw.total_reviews ?? 0),
      }
    : {
        total_xp: 0,
        words_learned: 0,
        words_mastered: 0,
        total_reviews: 0,
      };

  return c.json({
    data: {
      user: profile,
      streak,
      stats,
      due_today: dueToday,
      today_xp: Number(todayActivity?.xp_earned ?? 0),
    },
  });
});

user.get('/next-action', async (c) => {
  const { sub } = c.get('user');
  const data = await getStudyNextAction(c.env.DB, sub);
  return c.json({ data });
});

user.get('/due-words', async (c) => {
  const { sub } = c.get('user');
  const limit = Number(c.req.query('limit') ?? 20);
  const dueWords = await c.env.DB.prepare(
    `SELECT w.*, uwp.ease_factor, uwp.interval, uwp.repetitions, uwp.next_review, uwp.last_reviewed
     FROM user_word_progress uwp
     JOIN words w ON uwp.word_id = w.id
     WHERE uwp.user_id = ? AND uwp.next_review <= datetime('now')
       AND (uwp.flashcard_eligible_at IS NULL OR uwp.flashcard_eligible_at <= datetime('now'))
     ORDER BY uwp.next_review ASC
     LIMIT ?`
  ).bind(sub, limit).all();
  return c.json({ data: dueWords.results });
});

user.post('/progress', async (c) => {
  const { sub } = c.get('user');
  const body = await readJsonBody<{
    results: ProgressResult[];
    xp_earned: number;
    session_type: string;
  }>(c);
  if (!body) return jsonBodyInvalid(c);

  await c.env.DB.batch(buildProgressStatements(c.env.DB, sub, body.results));
  await bumpStats(c.env.DB, sub, body.xp_earned, body.results.length);
  await updateStreak(c.env.DB, sub);

  return c.json({ message: 'Явц хадгалагдлаа', data: { xp_earned: body.xp_earned } });
});

export default user;
