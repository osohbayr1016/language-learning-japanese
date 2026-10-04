import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import { publishedLessonTree, safeAll } from '../lib/lessonCatalog';
import { fetchPublishedLessonDetail } from '../lib/lessonDetail';
import { computeLessonFlashcardEligibleAt } from '../lib/lessonFlashcardDelay';
import { lessonChapterJlptLevel, passesJlptN5AdvanceGate } from '../lib/jlptGate';
import { jsonBodyInvalid, readJsonBody } from '../lib/requestJson';
import { applyLessonCompletion, type LessonCompletionBody } from '../lib/lessonCompletion';

const lessons = new Hono<{ Bindings: Env; Variables: Variables }>();

// Public catalog (same shape as GET / but progress always null) — web + fallback when auth fetch fails.
lessons.get('/catalog', async (c) => {
  const data = await publishedLessonTree(c.env.DB, null);
  return c.json({ data });
});

// Public lesson body — нэвтрээгүй хэрэглэгч ч JLPT замаар суралцах боломжтой.
lessons.get('/public/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Буруу id' }, 400);
  const result = await fetchPublishedLessonDetail(c.env.DB, id, null);
  if (!result.ok) return c.json({ error: 'Хичээл олдсонгүй' }, 404);
  return c.json({ data: result.data });
});

lessons.use('*', authMiddleware);

// GET /api/lessons — chapters + lessons + my progress
lessons.get('/', async (c) => {
  const { sub } = c.get('user');
  const progressRes = await safeAll(
    c.env.DB
      .prepare(
        `SELECT lesson_id, best_accuracy, attempts, completed_at
         FROM user_lesson_progress WHERE user_id = ?`
      )
      .bind(sub)
      .all()
  );
  const progress = new Map<number, { best_accuracy: number; attempts: number; completed_at: string | null }>();
  for (const row of progressRes.results ?? []) {
    const p = row as {
      lesson_id: number;
      best_accuracy: number;
      attempts: number;
      completed_at: string | null;
    };
    progress.set(p.lesson_id, {
      best_accuracy: p.best_accuracy,
      attempts: p.attempts,
      completed_at: p.completed_at,
    });
  }
  const dataRaw = await publishedLessonTree(c.env.DB, progress);
  const gateOk = await passesJlptN5AdvanceGate(c.env.DB, sub);
  const data = (dataRaw as { jlpt_level?: number; lessons?: unknown[] }[]).map((ch) => ({
    ...ch,
    locked_below_advance_gate:
      typeof ch.jlpt_level === 'number' && ch.jlpt_level >= 2 && !gateOk,
  }));
  return c.json({ data, advance_gate_ok: gateOk });
});

// GET /api/lessons/:id — lesson detail with full word rows + user progress
lessons.get('/:id', async (c) => {
  const { sub } = c.get('user');
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Буруу id' }, 400);
  const jlptLevel = await lessonChapterJlptLevel(c.env.DB, id);
  if (jlptLevel !== null && jlptLevel >= 2) {
    const gateOk = await passesJlptN5AdvanceGate(c.env.DB, sub);
    if (!gateOk) {
      return c.json(
        {
          error: 'JLPT N5-ийг дуусгана уу эсвэл mock шалгалтад тэнцнэ үү.',
          code: 'JLPT_ADVANCE_GATE',
        },
        403
      );
    }
  }
  const result = await fetchPublishedLessonDetail(c.env.DB, id, sub);
  if (!result.ok) return c.json({ error: 'Хичээл олдсонгүй' }, 404);
  return c.json({ data: result.data });
});

// POST /api/lessons/:id/complete — record results, award XP, bump streak
lessons.post('/:id/complete', async (c) => {
  const { sub } = c.get('user');
  const lessonId = Number(c.req.param('id'));
  if (!Number.isFinite(lessonId)) return c.json({ error: 'Буруу id' }, 400);

  const jlptLevel = await lessonChapterJlptLevel(c.env.DB, lessonId);
  if (jlptLevel === null) return c.json({ error: 'Хичээл олдсонгүй' }, 404);
  if (jlptLevel >= 2) {
    const gateOk = await passesJlptN5AdvanceGate(c.env.DB, sub);
    if (!gateOk) {
      return c.json(
        {
          error: 'JLPT N5-ийг дуусгана уу эсвэл mock шалгалтад тэнцнэ үү.',
          code: 'JLPT_ADVANCE_GATE',
        },
        403
      );
    }
  }

  const body = await readJsonBody<LessonCompletionBody>(c);
  if (!body) return jsonBodyInvalid(c);
  if (typeof body.accuracy !== 'number' || !Number.isFinite(body.accuracy)) {
    return c.json({ error: 'Нарийвчлал буруу байна' }, 400);
  }

  const eligibleAt = await computeLessonFlashcardEligibleAt(c.env.DB, lessonId);
  try {
    const data = await applyLessonCompletion(c.env.DB, sub, lessonId, body, eligibleAt);
    return c.json({
      message: data.already_applied ? 'Хичээлийн дүн өмнө нь хадгалагдсан' : 'Хичээлийн дүн хадгалагдлаа',
      data,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_ACCURACY') {
      return c.json({ error: 'Нарийвчлал буруу байна' }, 400);
    }
    throw error;
  }
});

export default lessons;
