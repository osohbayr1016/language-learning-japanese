import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import { updateStreak } from '../lib/streak';
import { buildProgressStatements, bumpStats, type ProgressResult } from '../lib/progress';
import {
  bumpDailyActivity,
  bumpLessonOutcome,
  bumpSkillStats,
  type SkillResults,
} from '../lib/activity';
import { publishedLessonTree, safeAll } from '../lib/lessonCatalog';
import { fetchPublishedLessonDetail } from '../lib/lessonDetail';
import { computeLessonFlashcardEligibleAt } from '../lib/lessonFlashcardDelay';
import { lessonChapterJlptLevel, passesJlptN5AdvanceGate } from '../lib/hskGate';
import { jsonBodyInvalid, readJsonBody } from '../lib/requestJson';

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

  const body = await readJsonBody<{
    accuracy: number;
    xp_earned: number;
    duration_seconds?: number;
    results?: ProgressResult[];
    skill_results?: SkillResults;
  }>(c);
  if (!body) return jsonBodyInvalid(c);

  const accuracy = Math.max(0, Math.min(1, body.accuracy));
  const xp = Math.max(0, Math.floor(body.xp_earned));
  const rawResults = body.results ?? [];
  const eligibleAt = await computeLessonFlashcardEligibleAt(c.env.DB, lessonId);
  const results = rawResults.map((r) => ({ ...r, flashcard_eligible_at: eligibleAt }));
  const duration = Math.max(0, Math.floor(body.duration_seconds ?? 0));

  const stmts = [
    c.env.DB.prepare(
      `INSERT INTO user_lesson_progress (user_id, lesson_id, best_accuracy, attempts, completed_at, updated_at)
       VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         best_accuracy = MAX(user_lesson_progress.best_accuracy, excluded.best_accuracy),
         attempts = user_lesson_progress.attempts + 1,
         completed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`
    ).bind(sub, lessonId, accuracy),
    ...buildProgressStatements(c.env.DB, sub, results),
  ];

  await c.env.DB.batch(stmts);
  await bumpStats(c.env.DB, sub, xp, results.length);
  await updateStreak(c.env.DB, sub);
  await bumpDailyActivity(c.env.DB, sub, duration);
  await bumpLessonOutcome(c.env.DB, sub, accuracy >= 0.95);
  if (body.skill_results) await bumpSkillStats(c.env.DB, sub, body.skill_results);

  return c.json({
    message: 'Хичээл хадгалагдлаа',
    data: { lesson_id: lessonId, accuracy, xp_earned: xp },
  });
});

export default lessons;
