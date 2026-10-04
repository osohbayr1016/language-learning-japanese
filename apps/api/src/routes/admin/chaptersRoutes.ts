import type { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { jsonBodyInvalid, readJsonBody } from '../../lib/requestJson';

export function registerChapterRoutes(admin: Hono<{ Bindings: Env; Variables: Variables }>) {
  admin.get('/chapters', async (c) => {
    const rows = await c.env.DB.prepare(
      `SELECT id, title_mn, subtitle_mn, color, jlpt_level, order_num, is_published,
              flashcard_delay_days, created_at
       FROM chapters ORDER BY order_num ASC`
    ).all();
    return c.json({ data: rows.results ?? [] });
  });

  admin.post('/chapters', async (c) => {
    const body = await readJsonBody<{
      title_mn: string;
      subtitle_mn?: string;
      color?: string;
      jlpt_level?: number;
      order_num?: number;
      is_published?: number;
      flashcard_delay_days?: number;
    }>(c);
    if (!body) return jsonBodyInvalid(c);
    const title = typeof body.title_mn === 'string' ? body.title_mn.trim() : '';
    if (!title) return c.json({ error: 'Гарчиг шаардлагатай' }, 400);
    const row = await c.env.DB.prepare(
      `INSERT INTO chapters (title_mn, subtitle_mn, color, jlpt_level, order_num, is_published, flashcard_delay_days)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`
    )
      .bind(
        title,
        body.subtitle_mn ?? '',
        body.color ?? '#58CC02',
        Math.min(5, Math.max(1, Number(body.jlpt_level ?? 1))),
        Number(body.order_num ?? 0),
        body.is_published === undefined ? 0 : body.is_published ? 1 : 0,
        Math.min(365, Math.max(0, Math.floor(Number(body.flashcard_delay_days ?? 3))))
      )
      .first<{ id: number }>();
    return c.json({ data: { id: row?.id } }, 201);
  });

  admin.patch('/chapters/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) return c.json({ error: 'Буруу id' }, 400);
    const body = await readJsonBody<{
      title_mn?: string;
      subtitle_mn?: string;
      color?: string;
      jlpt_level?: number;
      order_num?: number;
      is_published?: number;
      flashcard_delay_days?: number;
    }>(c);
    if (!body) return jsonBodyInvalid(c);
    await c.env.DB.prepare(
      `UPDATE chapters SET
         title_mn = COALESCE(?, title_mn),
         subtitle_mn = COALESCE(?, subtitle_mn),
         color = COALESCE(?, color),
         jlpt_level = COALESCE(?, jlpt_level),
         order_num = COALESCE(?, order_num),
         is_published = COALESCE(?, is_published),
         flashcard_delay_days = COALESCE(?, flashcard_delay_days)
       WHERE id = ?`
    )
      .bind(
        body.title_mn?.trim() ?? null,
        body.subtitle_mn ?? null,
        body.color ?? null,
        body.jlpt_level !== undefined ? Math.min(5, Math.max(1, Number(body.jlpt_level))) : null,
        body.order_num !== undefined ? Number(body.order_num) : null,
        body.is_published !== undefined ? (body.is_published ? 1 : 0) : null,
        body.flashcard_delay_days !== undefined
          ? Math.min(365, Math.max(0, Math.floor(Number(body.flashcard_delay_days))))
          : null,
        id
      )
      .run();
    return c.json({ message: 'Шинэчлэгдлээ' });
  });

  admin.delete('/chapters/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) return c.json({ error: 'Буруу id' }, 400);
    await c.env.DB.prepare('DELETE FROM chapters WHERE id = ?').bind(id).run();
    return c.json({ message: 'Устгагдлаа' });
  });
}
