import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import {
  DEFAULT_PREFERENCES,
  validPreferences,
  validateEvent,
  canStudy,
  mergeEvents,
  type CourseEvent,
} from '../../../../packages/curriculum/src';
const course = new Hono<{ Bindings: Env; Variables: Variables }>();
course.use('*', authMiddleware);
course.get('/', async (c) => {
  const { sub } = c.get('user');
  const after = Math.max(0, Number(c.req.query('after')) || 0);
  const rows = await c.env.DB.prepare(
    'SELECT rowid AS cursor, payload FROM course_events WHERE user_id=? AND rowid>? ORDER BY rowid LIMIT 500',
  )
    .bind(sub, after)
    .all<{ cursor: number; payload: string }>();
  const setting = await c.env.DB.prepare(
    'SELECT preferences FROM course_settings WHERE user_id=?',
  )
    .bind(sub)
    .first<{ preferences: string }>();
  return c.json({
    data: {
      events: rows.results.map((r) => JSON.parse(r.payload)),
      cursor: rows.results.at(-1)?.cursor ?? after,
      hasMore: rows.results.length === 500,
      preferences: setting
        ? JSON.parse(setting.preferences)
        : DEFAULT_PREFERENCES,
    },
  });
});
course.post('/events', async (c) => {
  const { sub } = c.get('user');
  const raw = await c.req.text();
  if (raw.length > 200000) return c.json({ error: 'Хүсэлт хэт том' }, 413);
  let body: { events?: unknown[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return c.json({ error: 'Буруу JSON' }, 400);
  }
  if (
    !Array.isArray(body.events) ||
    body.events.length > 100 ||
    !body.events.every(validateEvent)
  )
    return c.json({ error: 'Буруу сургалтын үйл явдал' }, 400);
  const incoming = body.events as CourseEvent[];
  const rows = await c.env.DB.prepare(
    'SELECT payload FROM course_events WHERE user_id=? ORDER BY rowid LIMIT 20000',
  )
    .bind(sub)
    .all<{ payload: string }>();
  const current = rows.results.map((r) => JSON.parse(r.payload) as CourseEvent);
  if (current.length + incoming.length > 20000)
    return c.json(
      { error: 'Явцын хэмжээний хязгаарт хүрлээ. Экспорт хийнэ үү.' },
      409,
    );
  let prior = current;
  // Validate prerequisites before accepting new lesson evidence. Existing duplicates are harmless.
  for (const e of [...incoming].sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  )) {
    if (
      !current.some((x) => x.id === e.id) &&
      (e.kind === 'task' || e.kind === 'plan') &&
      !canStudy(prior, e.lessonId)
    )
      return c.json({ error: 'Өмнөх хичээлээ эхлээд дуусгана уу.' }, 409);
    prior = mergeEvents(prior, [e]);
  }
  if (incoming.length)
    await c.env.DB.batch(
      incoming.map((e) =>
        c.env.DB.prepare(
          'INSERT OR IGNORE INTO course_events(user_id,event_id,payload) VALUES(?,?,?)',
        ).bind(sub, e.id, JSON.stringify(e)),
      ),
    );
  return c.json({ ok: true, accepted: incoming.map((e) => e.id) });
});
course.put('/preferences', async (c) => {
  const { sub } = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!validPreferences(body)) return c.json({ error: 'Буруу тохиргоо' }, 400);
  await c.env.DB.prepare(
    'INSERT INTO course_settings(user_id,preferences) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET preferences=excluded.preferences,updated_at=CURRENT_TIMESTAMP',
  )
    .bind(sub, JSON.stringify(body))
    .run();
  return c.json({ ok: true });
});
export default course;
