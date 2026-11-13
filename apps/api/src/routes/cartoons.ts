import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import { jsonBodyInvalid, readJsonBody } from '../lib/requestJson';

const cartoons = new Hono<{ Bindings: Env; Variables: Variables }>();

function publicUrl(req: Request, key: string): string {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}/api/cartoons/file/${encodeURIComponent(key)}`;
}

// GET /api/cartoons — public list
cartoons.get('/', async (c) => {
  const jlptRaw = c.req.query('jlpt');
  let query = 'SELECT * FROM cartoons WHERE is_published = 1';
  const params: (string | number)[] = [];
  if (jlptRaw) {
    query += ' AND jlpt_level = ?';
    params.push(Number(jlptRaw));
  }
  query += ' ORDER BY created_at DESC LIMIT 50';

  const rows = await c.env.DB.prepare(query).bind(...params).all();
  const data = (rows.results ?? []).map((r) => ({
    ...r,
    thumbnail_url: r.thumbnail_key ? publicUrl(c.req.raw, r.thumbnail_key as string) : null,
  }));
  return c.json({ data });
});

// GET /api/cartoons/file/:key — stream from R2 (must come BEFORE /:id)
cartoons.get('/file/:key', async (c) => {
  const key = decodeURIComponent(c.req.param('key'));
  const obj = await c.env.STORAGE.get(key);
  if (!obj) return c.json({ error: 'Файл олдсонгүй' }, 404);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=86400');
  return new Response(obj.body, { headers });
});

// GET /api/cartoons/:id — detail with vocab + signed URLs
cartoons.get('/:id', async (c) => {
  const id = c.req.param('id');
  const cartoon = await c.env.DB.prepare(
    'SELECT * FROM cartoons WHERE id = ? AND is_published = 1'
  ).bind(id).first<any>();
  if (!cartoon) return c.json({ error: 'Хүүхэлдэй олдсонгүй' }, 404);

  const vocab = await c.env.DB.prepare(
    `SELECT w.*, cw.start_s, cw.end_s FROM cartoon_words cw
     JOIN words w ON cw.word_id = w.id
     WHERE cw.cartoon_id = ? ORDER BY cw.start_s ASC`
  ).bind(id).all();

  return c.json({
    data: {
      ...cartoon,
      video_url: publicUrl(c.req.raw, cartoon.video_key as string),
      thumbnail_url: cartoon.thumbnail_key
        ? publicUrl(c.req.raw, cartoon.thumbnail_key as string)
        : null,
      vocab: vocab.results ?? [],
    },
  });
});

// ===== ADMIN ROUTES =====

// POST /api/cartoons/upload — admin: upload file directly to R2, returns key
cartoons.post('/upload', authMiddleware, adminMiddleware, async (c) => {
  const filename = c.req.query('filename') ?? `upload_${Date.now()}`;
  const kind = (c.req.query('kind') ?? 'video') as 'video' | 'thumbnail';
  const ext = filename.includes('.') ? filename.split('.').pop() : kind === 'video' ? 'mp4' : 'jpg';
  const key = `cartoons/${kind}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const body = c.req.raw.body;
  if (!body) return c.json({ error: 'Файл алга' }, 400);
  const contentType = c.req.header('content-type') ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg');

  await c.env.STORAGE.put(key, body, { httpMetadata: { contentType } });

  return c.json({
    data: { key, url: publicUrl(c.req.raw, key) },
    message: 'Хадгалагдлаа',
  }, 201);
});

// POST /api/cartoons — admin: create cartoon
cartoons.post('/', authMiddleware, adminMiddleware, async (c) => {
  const body = await readJsonBody<{
    title_mn: string;
    description_mn?: string;
    video_key: string;
    thumbnail_key?: string;
    jlpt_level?: number;
    duration_s?: number;
    is_published?: boolean;
  }>(c);
  if (!body) return jsonBodyInvalid(c);
  const result = await c.env.DB.prepare(
    `INSERT INTO cartoons (title_mn, description_mn, video_key, thumbnail_key, jlpt_level, duration_s, is_published, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    body.title_mn, body.description_mn ?? '', body.video_key,
    body.thumbnail_key ?? null, body.jlpt_level ?? null, body.duration_s ?? 0,
    body.is_published ? 1 : 0, c.get('user').sub
  ).first<{ id: number }>();
  return c.json({ data: { id: result?.id }, message: 'Хүүхэлдэй үүслээ' }, 201);
});

// PUT /api/cartoons/:id — admin: update
cartoons.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  const body = await readJsonBody<{
    title_mn?: string;
    description_mn?: string;
    thumbnail_key?: string | null;
    jlpt_level?: number;
    duration_s?: number;
    is_published?: boolean;
  }>(c);
  if (!body) return jsonBodyInvalid(c);
  const id = c.req.param('id');
  await c.env.DB.prepare(
    `UPDATE cartoons SET
       title_mn = COALESCE(?, title_mn),
       description_mn = COALESCE(?, description_mn),
       thumbnail_key = COALESCE(?, thumbnail_key),
       jlpt_level = COALESCE(?, jlpt_level),
       duration_s = COALESCE(?, duration_s),
       is_published = COALESCE(?, is_published),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    body.title_mn ?? null, body.description_mn ?? null,
    body.thumbnail_key ?? null, body.jlpt_level ?? null,
    body.duration_s ?? null,
    body.is_published != null ? (body.is_published ? 1 : 0) : null,
    id
  ).run();
  return c.json({ message: 'Шинэчлэгдлээ' });
});

// POST /api/cartoons/:id/words — admin: attach vocab with timestamps
cartoons.post('/:id/words', authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await readJsonBody<{
    items: { word_id: number; start_s: number; end_s: number }[];
  }>(c);
  if (!body) return jsonBodyInvalid(c);
  const stmts = body.items.map((it) =>
    c.env.DB.prepare(
      `INSERT OR REPLACE INTO cartoon_words (cartoon_id, word_id, start_s, end_s)
       VALUES (?, ?, ?, ?)`
    ).bind(id, it.word_id, it.start_s, it.end_s)
  );
  await c.env.DB.batch(stmts);
  return c.json({ message: 'Үгнүүд нэмэгдлээ', data: { count: body.items.length } });
});

// DELETE /api/cartoons/:id — admin
cartoons.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  await c.env.DB.prepare('DELETE FROM cartoons WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ message: 'Устгагдлаа' });
});

export default cartoons;
