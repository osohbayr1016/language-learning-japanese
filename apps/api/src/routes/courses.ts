import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import { jsonBodyInvalid, readJsonBody } from '../lib/requestJson';

const courses = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /api/courses — public
courses.get('/', async (c) => {
  const jlptRaw = c.req.query('jlpt');
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = Number(c.req.query('offset') ?? 0);

  let query = `SELECT c.*, COUNT(DISTINCT cw.word_id) as word_count
               FROM courses c LEFT JOIN course_words cw ON c.id = cw.course_id
               WHERE c.is_published = 1`;
  const params: (string | number)[] = [];

  if (jlptRaw) {
    query += ' AND c.jlpt_level = ?';
    params.push(Number(jlptRaw));
  }

  query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ data: rows.results });
});

// GET /api/courses/:id — public
courses.get('/:id', async (c) => {
  const id = c.req.param('id');

  const course = await c.env.DB.prepare(
    'SELECT * FROM courses WHERE id = ? AND is_published = 1'
  ).bind(id).first();

  if (!course) return c.json({ error: 'Хичээл олдсонгүй' }, 404);

  return c.json({ data: course });
});

// GET /api/courses/:id/words — public
courses.get('/:id/words', async (c) => {
  const id = c.req.param('id');

  const words = await c.env.DB.prepare(
    `SELECT w.* FROM course_words cw JOIN words w ON cw.word_id = w.id
     WHERE cw.course_id = ? ORDER BY cw.order_index ASC`
  ).bind(id).all();

  return c.json({ data: words.results });
});

// ===== ADMIN ROUTES =====

// POST /api/courses — admin
courses.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await readJsonBody<{
    title_mn: string;
    title_jp?: string;
    description_mn?: string;
    thumbnail_url?: string | null;
    video_url?: string | null;
    jlpt_level?: number;
  }>(c);
  if (!body) return jsonBodyInvalid(c);

  const result = await c.env.DB.prepare(
    `INSERT INTO courses (title_mn, title_jp, description_mn, thumbnail_url, video_url, jlpt_level, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    body.title_mn, body.title_jp ?? '',
    body.description_mn ?? '', body.thumbnail_url ?? null,
    body.video_url ?? null, body.jlpt_level ?? 1,
    c.get('user').sub
  ).first<{ id: number }>();

  return c.json({ data: { id: result?.id }, message: 'Хичээл үүслээ' }, 201);
});

// PUT /api/courses/:id — admin
courses.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  const body = await readJsonBody<{
    title_mn?: string;
    title_jp?: string;
    description_mn?: string;
    thumbnail_url?: string | null;
    video_url?: string | null;
    jlpt_level?: number;
    is_published?: boolean;
  }>(c);
  if (!body) return jsonBodyInvalid(c);
  const id = c.req.param('id');

  await c.env.DB.prepare(
    `UPDATE courses SET
       title_mn = COALESCE(?, title_mn),
       title_jp = COALESCE(?, title_jp),
       description_mn = COALESCE(?, description_mn),
       thumbnail_url = COALESCE(?, thumbnail_url),
       video_url = COALESCE(?, video_url),
       jlpt_level = COALESCE(?, jlpt_level),
       is_published = COALESCE(?, is_published),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    body.title_mn ?? null, body.title_jp ?? null,
    body.description_mn ?? null, body.thumbnail_url ?? null,
    body.video_url ?? null, body.jlpt_level ?? null,
    body.is_published != null ? (body.is_published ? 1 : 0) : null,
    id
  ).run();

  return c.json({ message: 'Хичээл шинэчлэгдлээ' });
});

// POST /api/courses/:id/words — admin: add words to course
courses.post('/:id/words', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await readJsonBody<{ word_ids: number[] }>(c);
  if (!body) return jsonBodyInvalid(c);

  const statements = body.word_ids.map((wordId, idx) =>
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO course_words (course_id, word_id, order_index) VALUES (?, ?, ?)`
    ).bind(id, wordId, idx)
  );

  await c.env.DB.batch(statements);

  // Update word_count
  await c.env.DB.prepare(
    `UPDATE courses SET word_count = (
       SELECT COUNT(*) FROM course_words WHERE course_id = ?
     ) WHERE id = ?`
  ).bind(id, id).run();

  return c.json({ message: 'Үгнүүд нэмэгдлээ' });
});

// POST /api/courses/upload — admin: stream upload directly to R2
// Send file as raw body with `?filename=...&type=video|thumbnail`.
courses.post('/upload', authMiddleware, adminMiddleware, async (c) => {
  const filename = c.req.query('filename') ?? `upload_${Date.now()}`;
  const type = (c.req.query('type') ?? 'thumbnail') as 'video' | 'thumbnail';
  const ext = filename.includes('.') ? filename.split('.').pop() : type === 'video' ? 'mp4' : 'jpg';
  const key = `${type}s/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const body = c.req.raw.body;
  if (!body) return c.json({ error: 'Файл алга' }, 400);
  const contentType = c.req.header('content-type') ?? (type === 'video' ? 'video/mp4' : 'image/jpeg');
  await c.env.STORAGE.put(key, body, { httpMetadata: { contentType } });

  const u = new URL(c.req.url);
  const url = `${u.protocol}//${u.host}/api/cartoons/file/${encodeURIComponent(key)}`;
  return c.json({ data: { key, url } }, 201);
});

// DELETE /api/courses/:id — admin
courses.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  await c.env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ message: 'Хичээл устгагдлаа' });
});

export default courses;
