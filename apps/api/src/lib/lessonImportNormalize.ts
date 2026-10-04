import type {
  ImportedDialogue,
  ImportedLessonContent,
  ImportedNote,
  ImportedVocab,
  ImportedWorkbookItem,
  LessonHtmlPreview,
} from './lessonImportTypes';
import { vocabQuizMismatchWarnings } from './lessonImportQuizWarnings';
import { rejectLegacyChineseLessonFields, validateImportedLessonContent } from './lessonContentValidation';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function jlpt(v: unknown): number {
  const n = Number(String(v ?? '').replace(/[^\d]/g, ''));
  return Math.min(5, Math.max(1, Number.isFinite(n) && n ? n : 1));
}

function notes(rows: unknown): ImportedNote[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => (Array.isArray(r) ? { title: str(r[0]), body: str(r[1]) } : null))
    .filter((r): r is ImportedNote => !!r?.title && !!r.body);
}

function vocab(rows: unknown): ImportedVocab[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) =>
      Array.isArray(r)
        ? { kanji: str(r[0]), romaji: str(r[1]), meaning_mn: str(r[2]), jlpt_level: jlpt(r[3]) }
        : null
    )
    .filter((r): r is ImportedVocab => !!r?.kanji && !!r.romaji && !!r.meaning_mn);
}

function line(raw: unknown) {
  if (Array.isArray(raw)) return { speaker: str(raw[0]), jp: str(raw[1]), mn: str(raw[2]) };
  const r = (raw ?? {}) as Record<string, unknown>;
  return { speaker: str(r.speaker), jp: str(r.jp), mn: str(r.mn) };
}

function dialogues(rows: unknown): ImportedDialogue[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const lines = Array.isArray(r.lines) ? r.lines.map(line).filter((l) => l.jp || l.mn) : undefined;
    return {
      no: Number(r.no ?? i + 1),
      title: str(r.title),
      lines,
      text_jp: str(r.text_jp),
      text_mn: str(r.text_mn),
    };
  });
}

function workbookItem(raw: unknown): ImportedWorkbookItem | null {
  if (typeof raw === 'string') return { q: raw.trim() };
  if (Array.isArray(raw)) return { q: raw.join(' / '), parts: raw.map(str).filter(Boolean) };
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const options = Array.isArray(r.options) ? r.options.map(str).filter(Boolean) : undefined;
  return { q: str(r.q), options, answer: r.answer as string | boolean | null | undefined };
}

function workbook(raw: unknown): ImportedLessonContent['workbook'] {
  const sections = Array.isArray((raw as { sections?: unknown[] } | null)?.sections)
    ? (raw as { sections: unknown[] }).sections
    : [];
  return {
    sections: sections.map((s) => {
      const row = (s ?? {}) as Record<string, unknown>;
      const items = Array.isArray(row.items)
        ? row.items.map(workbookItem).filter((i): i is ImportedWorkbookItem => Boolean(i))
        : [];
      const bank = Array.isArray(row.bank) ? row.bank.map(str).filter(Boolean) : undefined;
      return { type: str(row.type) || 'workbook', title: str(row.title), bank, items };
    }),
  };
}

function countWorkbook(content: ImportedLessonContent): number {
  return content.workbook.sections.reduce((n, s) => n + s.items.length, 0);
}

function optionalPositiveInt(v: unknown): number | undefined {
  const n = typeof v === 'string' || typeof v === 'number' ? Number(String(v).trim()) : NaN;
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.trunc(n);
}

export function normalizeLessonImport(raw: unknown): ImportedLessonContent {
  rejectLegacyChineseLessonFields(raw);
  const root = (raw ?? {}) as Record<string, unknown>;
  const lesson = (root.lesson ?? {}) as Record<string, unknown>;
  const mockExamId = optionalPositiveInt(lesson.mock_exam_template_id) ?? optionalPositiveInt(root.mock_exam_template_id);
  const content: ImportedLessonContent = {
    external_lesson_id: str(lesson.id),
    title_jp: str(lesson.title_jp),
    title_mn: str(lesson.title_mn),
    source: str(lesson.source) || 'HTML lesson import',
    summary: str(lesson.summary),
    dialogues: dialogues(lesson.dialogues),
    vocab: vocab(lesson.vocab),
    grammar: notes(lesson.grammar),
    slang: notes(lesson.slang),
    workbook: workbook(root.workbook),
    quizlet_text: str(lesson.quizlet_text) || str(root.quizlet_text),
    ...(mockExamId != null ? { mock_exam_template_id: mockExamId } : {}),
  };
  if (!content.external_lesson_id) throw new Error('lesson.id хоосон байна');
  if (!content.title_mn && !content.title_jp) throw new Error('Хичээлийн гарчиг хоосон байна');
  if (!content.vocab.length) throw new Error('Үгийн сан хоосон байна');
  const validation = validateImportedLessonContent(content);
  if (validation.errors.length) throw new Error(validation.errors.join(' '));
  return content;
}

export function previewLessonImport(content: ImportedLessonContent): LessonHtmlPreview {
  return {
    external_lesson_id: content.external_lesson_id,
    title_jp: content.title_jp,
    title_mn: content.title_mn,
    source: content.source,
    vocab_count: content.vocab.length,
    dialogue_count: content.dialogues.length,
    grammar_count: content.grammar.length,
    workbook_count: countWorkbook(content),
    warnings: vocabQuizMismatchWarnings(content),
  };
}
