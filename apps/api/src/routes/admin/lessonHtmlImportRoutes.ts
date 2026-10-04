import type { Hono } from 'hono';
import { extractJsonDataFromLessonHtml, extractQuizletTextFromLessonHtml } from '../../lib/lessonHtmlExtract';
import { normalizeLessonImport, previewLessonImport } from '../../lib/lessonImportNormalize';
import { storeImportedLesson } from '../../lib/lessonImportStore';
import { resolveImportedWords, validateImportedWords } from '../../lib/lessonImportWords';
import type { Env, Variables } from '../../types';

type ImportBody = {
  html?: string;
  chapter_id?: number;
  is_published?: boolean;
};

const MAX_HTML_BYTES = 2_000_000;

function parseBody(raw: ImportBody | null): ImportBody {
  if (!raw || typeof raw !== 'object') throw new Error('Буруу хүсэлт');
  const html = typeof raw.html === 'string' ? raw.html : '';
  if (!html.trim()) throw new Error('HTML файл хоосон байна');
  if (new TextEncoder().encode(html).length > MAX_HTML_BYTES) {
    throw new Error('HTML файл хэт том байна');
  }
  return raw;
}

export function registerLessonHtmlImportRoutes(admin: Hono<{ Bindings: Env; Variables: Variables }>) {
  admin.post('/lessons/import-html/preview', async (c) => {
    try {
      const body = parseBody(await c.req.json<ImportBody>().catch(() => null));
      const raw = extractJsonDataFromLessonHtml(body.html ?? '');
      const content = normalizeLessonImport(raw);
      content.quizlet_text = extractQuizletTextFromLessonHtml(body.html ?? '');
      await validateImportedWords(content.vocab);
      return c.json({ data: previewLessonImport(content) });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'Импорт шалгахад алдаа гарлаа' }, 400);
    }
  });

  admin.post('/lessons/import-html', async (c) => {
    try {
      const body = parseBody(await c.req.json<ImportBody>().catch(() => null));
      const chapterId = Number(body.chapter_id);
      if (!Number.isFinite(chapterId)) throw new Error('chapter_id шаардлагатай');

      const raw = extractJsonDataFromLessonHtml(body.html ?? '');
      const content = normalizeLessonImport(raw);
      content.quizlet_text = extractQuizletTextFromLessonHtml(body.html ?? '');
      await validateImportedWords(content.vocab);
      const wordStats = await resolveImportedWords(c.env.DB, content.vocab);
      const lessonId = await storeImportedLesson(c.env.DB, {
        chapterId,
        content,
        links: wordStats.links,
        isPublished: body.is_published === true,
      });
      return c.json({
        data: {
          ...previewLessonImport(content),
          lesson_id: lessonId,
          inserted_words: wordStats.inserted,
          reused_words: wordStats.reused,
          linked_words: wordStats.links.length,
        },
      }, 201);
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : 'Импорт хадгалахад алдаа гарлаа' }, 400);
    }
  });
}
