import { Hono } from 'hono';
import type { Env, Variables } from '../../types';
import { examAnswerOk, sectionalScores } from '../../lib/examScoring';

type GradeRow = {
  id: number;
  section: string;
  question_type: string;
  correct_answer: string;
};

export function registerExamSubmitRoute(app: Hono<{ Bindings: Env; Variables: Variables }>) {
  app.post('/sessions/:sid/submit', async (c) => {
    const sid = Number(c.req.param('sid'));
    const { sub } = c.get('user');
    if (!Number.isFinite(sid)) return c.json({ error: 'Буруу session' }, 400);

    const sessRaw = (await c.env.DB.prepare(
      `SELECT s.user_id AS uid, s.template_id AS tid, s.status,
              COALESCE(t.passing_score, 80) AS passing_score,
              COALESCE(t.max_score, 180) AS max_score, t.jlpt_level
       FROM user_exam_sessions s JOIN exam_templates t ON t.id = s.template_id
       WHERE s.id = ?`
    )
      .bind(sid)
      .first()) as {
      uid?: number;
      tid?: number;
      status?: string;
      passing_score?: number;
      max_score?: number;
      jlpt_level?:number;
    } | null;

    if (!sessRaw || sessRaw.uid !== sub) return c.json({ error: 'Олдсонгүй' }, 404);
    if (sessRaw.status === 'completed') return c.json({ error: 'Илгээгдсэн' }, 409);

    if(sessRaw.max_score!==180)return c.json({error:'Хуучин сорил. Япон JLPT сорилоо дахин сонгоно уу.'},409);
    const tpl = sessRaw.tid;
    const passLineVal = sessRaw.passing_score ?? 80;
    const maxScoreVal = Math.max(1, Number(sessRaw.max_score) || 180);

    const body = await c.req
      .json<{ answers?: { question_id: number; answer: unknown }[]; duration_seconds?: number }>()
      .catch(() => ({ answers: [], duration_seconds: 0 }));

    const answersMap = new Map<number, unknown>();
    for (const a of body.answers ?? []) {
      if (!Number.isFinite(a.question_id)) continue;
      answersMap.set(Number(a.question_id), a.answer ?? '');
    }

    const gradeQs = (
      (((await c.env.DB
        .prepare(
          `SELECT id, COALESCE(scoring_section,section) AS section, question_type, correct_answer FROM exam_questions
           WHERE template_id = ? ORDER BY order_num ASC`
        )
        .bind(tpl)
        .all()) as { results?: GradeRow[] })?.results ?? []) as GradeRow[]
    ).filter(Boolean);

    const correctnessFlagById = new Map<number, boolean>();

    const stmBatch = gradeQs.map((ql) => {
      const ua = answersMap.has(ql.id) ? answersMap.get(ql.id) : '';
      const ok = examAnswerOk(ql.question_type, ua ?? '', ql.correct_answer) ? 1 : 0;
      correctnessFlagById.set(ql.id, Boolean(ok));
      return c.env.DB.prepare(
        `INSERT INTO user_exam_answers (session_id, question_id, user_answer, is_correct)
         VALUES (?, ?, ?, ?)`
      ).bind(sid, ql.id, String(ua ?? ''), ok);
    });

    await c.env.DB.batch(stmBatch);

    const sectional = sectionalScores(
      gradeQs.map((q) => ({ id: q.id, section: q.section })),
      correctnessFlagById,
      sessRaw.jlpt_level??1
    );

    await c.env.DB
      .prepare(
        `UPDATE user_exam_sessions SET
       status='completed',
       listening_score=?,
       reading_score=?,
       knowledge_score=?,
       total_score=?,
       passed=?,
       duration_seconds=?,
       completed_at=CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`
      )
      .bind(
        sectional.listening,
        sectional.reading,
        sectional.knowledge,
        sectional.total,
        sectional.passed ? 1 : 0,
        Math.max(0, Math.floor(body.duration_seconds ?? 0)),
        sid,
        sub
      )
      .run();

    return c.json({
      ok: true,
      data: {
        session_id: sid,
        listening_score: sectional.listening,
        reading_score: sectional.reading,
        knowledge_score: sectional.knowledge,
        knowledge_correct: sectional.knowledge_correct,
        knowledge_total: sectional.knowledge_total,
        score_kind: 'practice-proportional',
        total_score: sectional.total,
        passing_score: passLineVal,
        max_score: maxScoreVal,
        passed: sectional.passed,
        duration_seconds: Math.max(0, Math.floor(body.duration_seconds ?? 0)),
        listening_correct: sectional.listening_correct,
        listening_total: sectional.listening_total,
        reading_correct: sectional.reading_correct,
        reading_total: sectional.reading_total,
      },
    });
  });
}
