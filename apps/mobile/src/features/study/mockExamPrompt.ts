import type { ExamQuestion } from '../../lib/api/exams';

export function mockExamPromptText(q: ExamQuestion): string {
  /** Listening: scenario + Japanese audio script. Reading: Japanese passage + romaji reading aid. */
  if (q.section === 'listening') {
    return q.scenario_mn?.trim()??'Сонсож хариулна уу.';
  }
  return `${q.question_jp ?? ''}\n${q.question_romaji ?? ''}`.trim();
}

export function mockExamOptionStrings(q: ExamQuestion): string[] {
  return (Array.isArray(q.options) ? q.options : []).map((x) => String(x));
}
