import { request, buildQuery } from './client';
import { adminPaths } from './adminPaths';

export type { AdminStats, AdminLesson, AdminChapter, LessonWordLink } from './adminPaths';

export type AdminUserRow = {
  id: number;
  email: string;
  display_name: string;
  is_admin: number;
  created_at: string;
};

export type AdminCreateWordBody = {
  kanji: string;
  romaji: string;
  romaji_numbered?: string;
  kana?: string;
  meaning_mn: string;
  meaning_en?: string;
  jlpt_level?: number;
  part_of_speech?: string;
  example_jp?: string;
  example_romaji?: string;
  example_mn?: string;
  textbook_unit?: string | null;
};

export type AdminBulkResultRow =
  | { ok: true; id: number; kanji: string }
  | { ok: true; skipped: true; kanji: string }
  | { ok: false; kanji: string; error: string };

export type AdminBulkValidateRow =
  | { ok: true; kanji: string; strokeCount: number }
  | { ok: false; kanji: string; error: string };

export type LessonHtmlPreview = {
  external_lesson_id: string;
  title_jp: string;
  title_mn: string;
  source: string;
  vocab_count: number;
  dialogue_count: number;
  grammar_count: number;
  workbook_count: number;
  warnings: string[];
};

export type LessonHtmlImportResult = LessonHtmlPreview & {
  lesson_id: number;
  inserted_words: number;
  reused_words: number;
  linked_words: number;
};

export const adminApi = {
  ...adminPaths,
  users: (token: string, params: { limit?: number; offset?: number } = {}) =>
    request<{ data: AdminUserRow[] }>(`/api/admin/users${buildQuery(params)}`, { token }),
  validateWordsBulk: (
    token: string,
    body: { words: AdminCreateWordBody[]; jlpt_level?: number; textbook_unit?: string | null }
  ) =>
    request<{ data: { results: AdminBulkValidateRow[] } }>('/api/admin/words/bulk/validate', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  createWordsBulk: (
    token: string,
    body: {
      words: AdminCreateWordBody[];
      jlpt_level?: number;
      textbook_unit?: string | null;
      duplicate_policy?: 'fail' | 'skip';
    }
  ) =>
    request<{ data: { results: AdminBulkResultRow[] } }>('/api/admin/words/bulk', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  createWord: (token: string, body: AdminCreateWordBody & { reject_duplicate?: boolean }) =>
    request<{ data: { id: number }; message: string }>('/api/admin/words', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  previewLessonHtml: (token: string, html: string) =>
    request<{ data: LessonHtmlPreview }>('/api/admin/lessons/import-html/preview', {
      method: 'POST',
      token,
      body: JSON.stringify({ html }),
    }),
  importLessonHtml: (
    token: string,
    body: { html: string; chapter_id: number; is_published?: boolean }
  ) =>
    request<{ data: LessonHtmlImportResult }>('/api/admin/lessons/import-html', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
};
