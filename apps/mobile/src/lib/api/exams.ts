import { request } from './client';

export type ExamTemplate = {
  id: number;
  title: string;
  jlpt_level: number;
  total_questions: number;
  duration_minutes: number;
  passing_score: number;
  max_score: number;
};

export type ExamQuestion = {
  id: number;
  section: string;
  part_num: number;
  question_num: number;
  question_type: string;
  listen_jp?: string;
  scenario_mn?: string;
  question_jp?: string;
  question_romaji?: string;
  options: unknown[];
  order_num?: number;
  audio_url?: string;
};

export const exams = {
  templates: (token: string) =>
    request<{
      data: ExamTemplate[];
      my_mock: { best_total_score: number; has_passed: boolean };
    }>('/api/exams/templates', { token }),

  start: (token: string, templateId: number) =>
    request<{
      data: {
        session_id: number;
        duration_minutes: number;
        max_score: number;
        passing_score: number;
        questions: ExamQuestion[];
      };
    }>(`/api/exams/templates/${templateId}/start`, { method: 'POST', token }),

  submit: (
    token: string,
    sessionId: number,
    body: {
      answers: { question_id: number; answer: string | boolean }[];
      duration_seconds?: number;
    }
  ) =>
    request<{
      ok: boolean;
      data: {
        session_id: number;
        knowledge_score?:number;
        knowledge_correct?:number;
        knowledge_total?:number;
        listening_score: number;
        reading_score: number;
        total_score: number;
        passing_score: number;
        max_score: number;
        passed: boolean;
        duration_seconds: number;
        listening_correct: number;
        listening_total: number;
        reading_correct: number;
        reading_total: number;
      };
    }>(`/api/exams/sessions/${sessionId}/submit`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
};
