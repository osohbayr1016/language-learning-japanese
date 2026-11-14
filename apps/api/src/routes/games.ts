import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import { updateStreak } from '../lib/streak';
import { findReceipt, receiptStatement, rewardKey } from '../lib/rewardReceipts';
import { jsonBodyInvalid, readJsonBody } from '../lib/requestJson';
import { boundedInteger } from '../lib/queryNumbers';
import { validSessionId } from '../lib/rewardReceipts';

const games = new Hono<{ Bindings: Env; Variables: Variables }>();

games.use('*', authMiddleware);

// POST /api/games/session — save game result
games.post('/session', async (c) => {
  const { sub } = c.get('user');
  const body = await readJsonBody<{
    game_type: string;
    score: number;
    accuracy: number;
    duration_seconds: number;
    words_practiced: number;
    xp_earned: number;
    session_id?: string;
  }>(c);
  if (!body) return jsonBodyInvalid(c);
  const finite = (value: unknown, max: number) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
  if (
    (body.session_id !== undefined && !validSessionId(body.session_id)) ||
    typeof body.game_type !== 'string' ||
    !['match', 'translate', 'sentence', 'stroke', 'writer'].includes(body.game_type) ||
    !Number.isSafeInteger(body.score) || !finite(body.score, 100000) ||
    !finite(body.accuracy, 1) ||
    !Number.isSafeInteger(body.duration_seconds) || !finite(body.duration_seconds, 36000) ||
    !Number.isSafeInteger(body.words_practiced) || body.words_practiced < 1 ||
    !finite(body.words_practiced, 500) ||
    !Number.isSafeInteger(body.xp_earned) ||
    !finite(body.xp_earned, 1000) ||
    body.xp_earned > Math.round(body.score / (body.game_type === 'match' ? 5 : body.game_type === 'writer' ? 10 : 4))
  ) return c.json({ error: 'Тоглоомын үр дүн буруу байна' }, 400);

  const { sessionId, hash } = await rewardKey('game', body as Record<string, unknown>);
  const previous = await findReceipt(c.env.DB, sub, 'game', sessionId);
  if (previous) {
    if (previous.request_hash !== hash) return c.json({ error: 'Энэ session ID өөр өгөгдөлд ашиглагдсан байна' }, 409);
    return c.json({ message: 'Тоглоом өмнө хадгалагдсан', data: { xp_earned: 0, already_saved: true } });
  }
  const results = await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO game_sessions
       (user_id,game_type,score,accuracy,duration_seconds,words_practiced,xp_earned,session_id)
       VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`
    ).bind(sub, body.game_type, body.score, body.accuracy,
      body.duration_seconds, body.words_practiced, body.xp_earned, sessionId),
    receiptStatement(c.env.DB, sub, 'game', sessionId, hash, body.xp_earned, 0, body.duration_seconds),
  ]);
  const inserted = Number(results[1]?.meta?.changes ?? 0) === 1;
  const recorded = await findReceipt(c.env.DB, sub, 'game', sessionId);
  if (recorded?.request_hash !== hash)
    return c.json({ error: 'Энэ session ID өөр өгөгдөлд ашиглагдсан байна' }, 409);
  if (inserted) await updateStreak(c.env.DB, sub);
  return c.json({ message: 'Тоглоом хадгалагдлаа', data: { xp_earned: inserted ? body.xp_earned : 0, already_saved: !inserted } });
});

// GET /api/games/history
games.get('/history', async (c) => {
  const { sub } = c.get('user');
  const limit = boundedInteger(c.req.query('limit'), 10, 1, 100);

  const history = await c.env.DB.prepare(
    'SELECT * FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).bind(sub, limit).all();

  return c.json({ data: history.results });
});

// GET /api/games/leaderboard
games.get('/leaderboard', async (c) => {
  const leaderboard = await c.env.DB.prepare(
    `SELECT u.display_name, u.avatar_url, s.total_xp, s.words_mastered,
            st.current_streak
     FROM user_stats s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN user_streaks st ON st.user_id = u.id
     WHERE COALESCE(u.is_admin, 0) = 0
     ORDER BY s.total_xp DESC
     LIMIT 20`
  ).all();

  return c.json({ data: leaderboard.results });
});

export default games;
