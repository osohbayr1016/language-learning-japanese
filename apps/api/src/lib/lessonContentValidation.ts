import type { ImportedLessonContent } from './lessonImportTypes';

export type ContentValidation = {
  errors: string[];
  warnings: string[];
};

const JAPANESE_SCRIPT = /[\u3040-\u30ff\u3400-\u9fff]/u;

export function validateImportedLessonContent(content: ImportedLessonContent): ContentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.external_lesson_id.trim()) errors.push('lesson.id шаардлагатай.');
  if (!content.title_mn.trim()) errors.push('Монгол гарчиг шаардлагатай.');
  if (!content.title_jp.trim()) errors.push('Япон гарчиг шаардлагатай.');
  else if (!JAPANESE_SCRIPT.test(content.title_jp)) {
    warnings.push('Япон гарчигт япон бичиг илрээгүй — гараар шалгана уу.');
  }

  if (!content.vocab.length) errors.push('Хамгийн багадаа нэг үг шаардлагатай.');

  const seen = new Set<string>();
  content.vocab.forEach((word, index) => {
    const label = `Үг #${index + 1}`;
    if (!word.kanji.trim()) errors.push(`${label}: япон бичлэг хоосон.`);
    if (!word.romaji.trim()) errors.push(`${label}: romaji хоосон.`);
    if (!word.meaning_mn.trim()) errors.push(`${label}: монгол утга хоосон.`);
    if (!Number.isInteger(word.jlpt_level) || word.jlpt_level < 1 || word.jlpt_level > 5) {
      errors.push(`${label}: JLPT түвшин N5–N1 хүрээнд байх ёстой.`);
    }
    const key = `${word.kanji.trim()}::${word.romaji.trim().toLowerCase()}`;
    if (seen.has(key)) errors.push(`${label}: давхардсан үг (${word.kanji}).`);
    seen.add(key);
  });

  content.dialogues.forEach((dialogue, dIndex) => {
    dialogue.lines?.forEach((line, lIndex) => {
      if (!line.jp.trim()) errors.push(`Яриа #${dIndex + 1}, мөр #${lIndex + 1}: япон текст хоосон.`);
      if (!line.mn.trim()) errors.push(`Яриа #${dIndex + 1}, мөр #${lIndex + 1}: монгол тайлбар хоосон.`);
    });
    if (dialogue.text_jp && !JAPANESE_SCRIPT.test(dialogue.text_jp)) {
      warnings.push(`Яриа #${dIndex + 1}: япон текстэд япон бичиг илрээгүй.`);
    }
  });

  content.workbook.sections.forEach((section, sectionIndex) => {
    section.items.forEach((item, itemIndex) => {
      const label = `Дасгал #${sectionIndex + 1}.${itemIndex + 1}`;
      if (!item.q.trim()) errors.push(`${label}: асуулт хоосон.`);
      if (item.options && item.options.length > 0 && (item.answer === undefined || item.answer === null || item.answer === '')) {
        errors.push(`${label}: сонголттой асуултын зөв хариулт байхгүй.`);
      }
    });
  });

  return { errors, warnings };
}

export function rejectLegacyChineseLessonFields(raw: unknown): void {
  if (!raw || typeof raw !== 'object') return;

  const stack: unknown[] = [raw];
  const forbidden = new Set([
    'title_cn',
    'text_cn',
    'meaning_cn',
    'pinyin',
    'tone',
    'tones',
    'hsk_level',
  ]);

  while (stack.length) {
    const value = stack.pop();
    if (Array.isArray(value)) {
      stack.push(...value);
      continue;
    }
    if (!value || typeof value !== 'object') continue;

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (forbidden.has(key)) {
        throw new Error(`Хятад/HSK legacy талбар илэрлээ: ${key}. Япон JLPT schema ашиглана уу.`);
      }
      if (child && typeof child === 'object') stack.push(child);
    }
  }
}

export async function validateLessonForPublish(
  db: D1Database,
  lessonId: number,
  overrides: { title_mn?: string; chapter_id?: number } = {}
): Promise<ContentValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lesson = await db
    .prepare(
      `SELECT l.id, l.title_mn, l.chapter_id, c.jlpt_level
       FROM lessons l
       LEFT JOIN chapters c ON c.id = l.chapter_id
       WHERE l.id = ?`
    )
    .bind(lessonId)
    .first<{ id: number; title_mn: string; chapter_id: number; jlpt_level?: number }>();

  if (!lesson) return { errors: ['Хичээл олдсонгүй.'], warnings };

  const title = overrides.title_mn !== undefined ? overrides.title_mn.trim() : lesson.title_mn.trim();
  const chapterId = overrides.chapter_id !== undefined ? Number(overrides.chapter_id) : Number(lesson.chapter_id);

  if (!title) errors.push('Хичээлийн гарчиг хоосон байж болохгүй.');

  const chapter = await db
    .prepare('SELECT id, jlpt_level, is_published FROM chapters WHERE id = ?')
    .bind(chapterId)
    .first<{ id: number; jlpt_level: number; is_published: number }>();

  if (!chapter) errors.push('Сонгосон JLPT бүлэг олдсонгүй.');

  const [words, imported] = await Promise.all([
    db
      .prepare(
        `SELECT w.id, w.kanji, w.romaji, w.meaning_mn, w.jlpt_level
         FROM lesson_words lw JOIN words w ON w.id = lw.word_id
         WHERE lw.lesson_id = ?`
      )
      .bind(lessonId)
      .all<{ id: number; kanji: string; romaji: string; meaning_mn: string; jlpt_level: number }>(),
    db
      .prepare('SELECT content_json FROM lesson_contents WHERE lesson_id = ?')
      .bind(lessonId)
      .first<{ content_json?: string }>(),
  ]);

  if ((words.results?.length ?? 0) === 0 && !imported?.content_json) {
    errors.push('Нийтлэхийн өмнө хичээлд үг эсвэл импортолсон агуулга нэмнэ үү.');
  }

  for (const word of words.results ?? []) {
    if (!String(word.kanji ?? '').trim()) errors.push(`Үг #${word.id}: япон бичлэг хоосон.`);
    if (!String(word.romaji ?? '').trim()) errors.push(`Үг #${word.id}: romaji хоосон.`);
    if (!String(word.meaning_mn ?? '').trim()) errors.push(`Үг #${word.id}: монгол утга хоосон.`);
    if (chapter && Number(word.jlpt_level) > Number(chapter.jlpt_level) + 1) {
      warnings.push(`Үг #${word.id} нь бүлгээс мэдэгдэхүйц өндөр JLPT түвшинтэй байна.`);
    }
  }

  if (imported?.content_json) {
    try {
      const content = JSON.parse(imported.content_json) as ImportedLessonContent;
      const importedValidation = validateImportedLessonContent(content);
      errors.push(...importedValidation.errors);
      warnings.push(...importedValidation.warnings);
    } catch {
      errors.push('Импортолсон lesson content JSON эвдэрсэн байна.');
    }
  }

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}
