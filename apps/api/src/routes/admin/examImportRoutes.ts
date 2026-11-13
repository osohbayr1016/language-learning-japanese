import { Hono } from 'hono';
import { JLPT, jlptName } from '../../../../../packages/curriculum/src/jlpt';
import { rejectLegacyChineseLessonFields } from '../../lib/lessonContentValidation';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import type { Env, Variables } from '../../types';

type QIn = {
  section: string;
  part_num: number;
  question_num: number;
  audio_text?: string;
  question_text?: string;
  question_romaji?: string;
  options: unknown;
  correct_answer: string;
  order_num: number;
  audio_key?: string | null;
};

type ImportBody = {
  title?: string;
  jlpt_level?: number;
  duration_minutes?: number;
  passing_score?: number;
  max_score?: number;
  is_published?: boolean;
  questions?: QIn[];
};

function normOpts(o: unknown): string[] {
  if (!Array.isArray(o)) return [];
  return o.map((x) => String(x).trim()).filter(Boolean);
}

function resolvedAudioContentType(
  filename: string,
  headerCt: string | undefined,
): string {
  const h = headerCt?.trim();
  const ext = filename.includes('.')
    ? (filename.split('.').pop()?.toLowerCase() ?? '')
    : '';
  if (!h || h === 'application/octet-stream' || h === 'binary/octet-stream') {
    if (ext === 'mp3') return 'audio/mpeg';
    if (ext === 'wav' || ext === 'wave') return 'audio/wav';
    return 'audio/wav';
  }
  return h;
}

/** Monolith admin sub-router-д зөрүүтэй байж Workers дээр 404 гаргаж болох тул гол аппад шууд mount хийнэ. */
export const examImportApp = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

examImportApp.use('*', authMiddleware);
examImportApp.use('*', adminMiddleware);

examImportApp.post('/upload-audio', async (c) => {
  const filename = c.req.query('filename') ?? `q_${Date.now()}.wav`;
  const ext = filename.includes('.') ? filename.split('.').pop() : 'wav';
  const ct = resolvedAudioContentType(filename, c.req.header('content-type'));
  const key = `exams/audio/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const body = c.req.raw.body;
  if (!body) return c.json({ error: 'Файл алга' }, 400);
  await c.env.STORAGE.put(key, body, { httpMetadata: { contentType: ct } });
  return c.json({ data: { key } }, 201);
});

examImportApp.post('/import', async (c) => {
  const raw = await c.req.json<ImportBody>().catch(() => null);
  if (!raw || typeof raw !== 'object')
    return c.json({ error: 'Буруу JSON' }, 400);
  const body = raw;
  try {
    rejectLegacyChineseLessonFields(raw);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
  const jlpt = Number(body.jlpt_level);
  if (!Number.isInteger(jlpt) || jlpt < 1 || jlpt > 5)
    return c.json({ error: 'jlpt_level: 1=N5 … 5=N1' }, 400);

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return c.json({ error: 'Гарчиг хоосон' }, 400);
  const qs = Array.isArray(body.questions) ? body.questions : [];
  if (qs.length > 300) return c.json({ error: 'Асуултын хязгаар 300.' }, 400);
  if (!qs.length) return c.json({ error: 'Асуулт алга' }, 400);

  for (let i = 0; i < qs.length; i++) {
    const q = qs[i]!;
    if (
      !q ||
      typeof q !== 'object' ||
      !Array.isArray(q.options) ||
      !q.options.every(
        (o) => typeof o === 'string' && o.trim().length > 0 && o.length <= 1000,
      ) ||
      q.options.length > 8 ||
      !Number.isInteger(q.question_num) ||
      q.question_num < 1 ||
      !Number.isInteger(q.order_num)
    )
      return c.json({ error: `Буруу асуултын бүтэц: ${i + 1}` }, 400);
    if (
      q.section === 'listening' &&
      !q.audio_key &&
      (!q.audio_text || q.audio_text.length > 320)
    )
      return c.json(
        {
          error: `Сонсголын асуултад 1–320 тэмдэгтийн япон аудио текст эсвэл audio_key хэрэгтэй: ${i + 1}`,
        },
        400,
      );

    const opts = normOpts(q.options);
    if (opts.length < 2)
      return c.json({ error: `Сонголт хэт бага: ${i + 1}` }, 400);
    const pn = Number(q.part_num);
    if (!Number.isInteger(pn) || pn < 1 || pn > 4) {
      return c.json({ error: `Буруу part_num: ${i + 1}` }, 400);
    }
    if (!['knowledge', 'listening', 'reading'].includes(q.section))
      return c.json({ error: 'Буруу section' }, 400);
    const ca = String(q.correct_answer ?? '').trim();
    if (!opts.includes(ca))
      return c.json({ error: `Зөв хариу сонголтонд байхгүй: ${i + 1}` }, 400);
    if (q.audio_key != null && q.audio_key !== '') {
      const k = String(q.audio_key);
      if (!k.startsWith('exams/'))
        return c.json({ error: `Буруу audio_key: ${i + 1}` }, 400);
    }
  }

  const sections = new Set(qs.map((q) => q.section));
  if (
    !sections.has('listening') ||
    !sections.has('reading') ||
    (jlpt >= 3 && !sections.has('knowledge'))
  )
    return c.json({ error: 'JLPT-ийн шаардлагатай хэсгүүд дутуу байна.' }, 400);
  if (qs.length > 300) return c.json({ error: 'Асуултын хязгаар 300.' }, 400);
  const duration = Math.max(
    1,
    Math.min(300, Number(body.duration_minutes) || 60),
  );
  const maxScore = 180;
  const passScore = JLPT[jlptName(jlpt)].pass;
  const pub = body.is_published === true ? 1 : 0;

  const tid = Number.parseInt(
    crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    16,
  );
  const writes = [
    c.env.DB.prepare(
      `INSERT INTO exam_templates (id,title,jlpt_level,total_questions,duration_minutes,passing_score,max_score,is_published) VALUES(?,?,?,?,?,?,?,?)`,
    ).bind(tid, title, jlpt, qs.length, duration, passScore, maxScore, pub),
  ];
  const BATCH = 20;
  for (let off = 0; off < qs.length; off += BATCH) {
    const chunk = qs.slice(off, off + BATCH);
    const stmts = chunk.map((q) => {
      const ak =
        q.audio_key != null && String(q.audio_key).startsWith('exams/')
          ? String(q.audio_key)
          : null;
      return c.env.DB.prepare(
        `INSERT INTO exam_questions (template_id, section, part_num, question_num, question_type, audio_text, question_text, question_romaji, options, correct_answer, order_num, audio_key, scoring_section)
           VALUES (?, ?, ?, ?, 'paper_mcq', ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        tid,
        q.section === 'knowledge' ? 'reading' : q.section,
        q.part_num,
        q.question_num,
        q.audio_text ?? '',
        q.question_text ?? '',
        q.question_romaji ?? '',
        JSON.stringify(normOpts(q.options)),
        String(q.correct_answer).trim(),
        q.order_num,
        ak,
        q.section,
      );
    });
    writes.push(...stmts);
  }

  await c.env.DB.batch(writes);
  return c.json({ data: { template_id: tid } }, 201);
});
