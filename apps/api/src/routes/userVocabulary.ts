import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env, Variables } from '../types';
import { boundedInteger, positiveId } from '../lib/queryNumbers';

const vocab = new Hono<{ Bindings: Env; Variables: Variables }>();

vocab.use('*', authMiddleware);

const JOIN_WHERE = `FROM user_word_progress uwp
     JOIN words w ON w.id = uwp.word_id
     WHERE uwp.user_id = ?`;

/** Сайн биш гэж үзэх эвдрэлтэй үгс (SRS метрик эвэргүү). */
vocab.get('/weak', async (c) => {
  const sub = c.get('user').sub;
  const limit = boundedInteger(c.req.query('limit'), 15, 1, 80);

  const rows = await c.env.DB.prepare(
    `SELECT w.*, uwp.ease_factor, uwp.interval, uwp.repetitions, uwp.next_review,
            uwp.last_reviewed, uwp.flashcard_eligible_at,
            uwp.confidence_avg, uwp.avg_response_ms
     ${JOIN_WHERE}
       AND (
            (uwp.confidence_avg IS NOT NULL AND uwp.confidence_avg < 0.55)
         OR (COALESCE(uwp.repetitions, 0) <= 1 AND uwp.last_reviewed IS NOT NULL)
         OR (uwp.ease_factor < 2.2 AND uwp.ease_factor IS NOT NULL AND uwp.ease_factor > 0)
       )
     ORDER BY
       CASE WHEN uwp.confidence_avg IS NULL THEN 1 ELSE 0 END,
       uwp.confidence_avg ASC,
       uwp.ease_factor ASC,
       uwp.next_review ASC
     LIMIT ?`
  )
    .bind(sub, limit)
    .all();

  return c.json({ data: rows.results ?? [] });
});

/** Нэг үгийн хэрэглэгчийн үгийн явц (профайл дэлгэрэнгүй). */
vocab.get('/word/:wordId', async (c) => {
  const sub = c.get('user').sub;
  const wordId = positiveId(c.req.param('wordId'));
  if (wordId === null) return c.json({ error: 'Буруу id' }, 400);

  const row = await c.env.DB.prepare(
    `SELECT w.*, uwp.ease_factor, uwp.interval, uwp.repetitions, uwp.next_review,
            uwp.last_reviewed, uwp.flashcard_eligible_at
     ${JOIN_WHERE} AND uwp.word_id = ?`
  )
    .bind(sub, wordId)
    .first();

  if (!row) return c.json({ error: 'Явц олдсонгүй' }, 404);
  return c.json({ data: row });
});

vocab.get('/', async (c) => {
  const sub = c.get('user').sub;
  const limit = boundedInteger(c.req.query('limit'), 40, 1, 100);
  const offset = boundedInteger(c.req.query('offset'), 0, 0, 100000);
  const textbookUnit = (c.req.query('textbook_unit') ?? '').trim();

  const countParams: (string | number)[] = [sub];
  let countWhere = `${JOIN_WHERE}`;
  if (textbookUnit) {
    countWhere += ' AND w.textbook_unit = ?';
    countParams.push(textbookUnit);
  }

  const totalRow = await c.env.DB
    .prepare(`SELECT COUNT(*) AS n ${countWhere}`)
    .bind(...countParams)
    .first<{ n: number }>();
  const total = Number(totalRow?.n ?? 0);

  const listParams = [...countParams, limit, offset];
  const listWhere = textbookUnit ? `${JOIN_WHERE} AND w.textbook_unit = ?` : JOIN_WHERE;

  const rows = await c.env.DB.prepare(
    `SELECT w.*, uwp.ease_factor, uwp.interval, uwp.repetitions, uwp.next_review,
            uwp.last_reviewed, uwp.flashcard_eligible_at
     ${listWhere}
     ORDER BY
       CASE WHEN uwp.last_reviewed IS NULL THEN 1 ELSE 0 END,
       uwp.last_reviewed DESC,
       uwp.next_review ASC
     LIMIT ? OFFSET ?`
  )
    .bind(sub, ...(textbookUnit ? [textbookUnit] : []), limit, offset)
    .all();

  return c.json({
    data: rows.results ?? [],
    total,
    limit,
    offset,
    has_more: offset + limit < total,
  });
});

/** Allow learner to move word into flashcard queue before delay ends. */
vocab.patch('/:wordId/eligibility', async (c) => {
  const sub = c.get('user').sub;
  const wordId = positiveId(c.req.param('wordId'));
  if (wordId === null) return c.json({ error: 'Буруу id' }, 400);

  const r = await c.env.DB.prepare(
    `UPDATE user_word_progress SET flashcard_eligible_at = datetime('now')
     WHERE user_id = ? AND word_id = ?`
  )
    .bind(sub, wordId)
    .run();

  if (!r.meta?.changes) return c.json({ error: 'Явц олдсонгүй' }, 404);
  return c.json({ message: 'Боловсорлоо' });
});

export default vocab;
