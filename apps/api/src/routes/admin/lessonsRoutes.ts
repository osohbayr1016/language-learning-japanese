import type { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { fetchLessonDetailForAdminPreview } from '../../lib/lessonDetail';
import { jsonBodyInvalid, readJsonBody } from '../../lib/requestJson';
import { validateLessonForPublish } from '../../lib/lessonContentValidation';

export function registerLessonRoutes(admin: Hono<{ Bindings: Env; Variables: Variables }>) {
  admin.get('/lessons/:id/preview', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) return c.json({ error: 'Буруу id' }, 400);
    const { sub } = c.get('user');
    const result = await fetchLessonDetailForAdminPreview(c.env.DB, id, sub);
    if (!result.ok) return c.json({ error: 'Хичээл олдсонгүй' }, 404);
    return c.json({ data: result.data });
  });

  admin.get('/lessons', async (c) => {
    const chapterId = c.req.query('chapter_id');
    if (!chapterId) return c.json({ error: 'chapter_id шаардлагатай' }, 400);
    const cid = Number(chapterId);
    if (!Number.isFinite(cid)) return c.json({ error: 'Буруу chapter_id' }, 400);
    const rows = await c.env.DB.prepare(
      `SELECT id, chapter_id, title_mn, subtitle_mn, icon, order_num, is_published, created_at,
              (SELECT COUNT(*) FROM lesson_words WHERE lesson_id = lessons.id) AS word_count
       FROM lessons WHERE chapter_id = ? ORDER BY order_num ASC`
    )
      .bind(cid)
      .all();
    return c.json({ data: rows.results ?? [] });
  });

  admin.post('/lessons', async (c) => {
    const body = await readJsonBody<{
      chapter_id: number;
      title_mn: string;
      subtitle_mn?: string;
      icon?: string;
      order_num?: number;
      is_published?: number;
    }>(c);
    if (!body) return jsonBodyInvalid(c);
    const chId = Number(body.chapter_id);
    const title = typeof body.title_mn === 'string' ? body.title_mn.trim() : '';
    if (!Number.isFinite(chId) || !title) return c.json({ error: 'chapter_id, title_mn шаардлагатай' }, 400);
    if (body.is_published) {
      return c.json({ error: 'Шинэ хичээлийг эхлээд draft-аар үүсгээд, агуулгаа нэмсний дараа нийтэлнэ үү.' }, 400);
    }
    const row = await c.env.DB.prepare(
      `INSERT INTO lessons (chapter_id, title_mn, subtitle_mn, icon, order_num, is_published)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
    )
      .bind(
        chId,
        title,
        body.subtitle_mn ?? '',
        body.icon ?? 'book',
        Number(body.order_num ?? 0),
        0
      )
      .first<{ id: number }>();
    return c.json({ data: { id: row?.id } }, 201);
  });

  admin.patch('/lessons/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) return c.json({ error: 'Буруу id' }, 400);
    const body = await readJsonBody<{
      chapter_id?: number;
      title_mn?: string;
      subtitle_mn?: string;
      icon?: string;
      order_num?: number;
      is_published?: number;
    }>(c);
    if (!body) return jsonBodyInvalid(c);
    if (body.is_published) {
      const validation = await validateLessonForPublish(c.env.DB, id, {
        title_mn: body.title_mn,
        chapter_id: body.chapter_id,
      });
      if (validation.errors.length) {
        return c.json({
          error: 'Хичээлийг нийтлэхэд бэлэн биш байна',
          code: 'LESSON_PUBLISH_VALIDATION',
          details: validation.errors,
          warnings: validation.warnings,
        }, 400);
      }
    }
    await c.env.DB.prepare(
      `UPDATE lessons SET
         chapter_id = COALESCE(?, chapter_id),
         title_mn = COALESCE(?, title_mn),
         subtitle_mn = COALESCE(?, subtitle_mn),
         icon = COALESCE(?, icon),
         order_num = COALESCE(?, order_num),
         is_published = COALESCE(?, is_published)
       WHERE id = ?`
    )
      .bind(
        body.chapter_id !== undefined ? Number(body.chapter_id) : null,
        body.title_mn?.trim() ?? null,
        body.subtitle_mn ?? null,
        body.icon ?? null,
        body.order_num !== undefined ? Number(body.order_num) : null,
        body.is_published !== undefined ? (body.is_published ? 1 : 0) : null,
        id
      )
      .run();
    return c.json({ message: 'Шинэчлэгдлээ' });
  });

  admin.delete('/lessons/:id', async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) return c.json({ error: 'Буруу id' }, 400);
    await c.env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
    return c.json({ message: 'Устгагдлаа' });
  });
}
