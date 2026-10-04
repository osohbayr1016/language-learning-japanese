import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rejectLegacyChineseLessonFields,
  validateImportedLessonContent,
} from '../src/lib/lessonContentValidation';
import { normalizeLessonImport } from '../src/lib/lessonImportNormalize';

const validContent = {
  external_lesson_id: 'jp-n5-001',
  title_jp: 'はじめまして',
  title_mn: 'Анх удаа уулзах',
  source: 'internal',
  summary: 'Танилцах хэллэг',
  dialogues: [
    { no: 1, title: '会話', lines: [{ speaker: 'A', jp: 'はじめまして。', mn: 'Танилцахад таатай байна.' }] },
  ],
  vocab: [
    { kanji: '私', romaji: 'watashi', meaning_mn: 'би', jlpt_level: 1 },
  ],
  grammar: [],
  slang: [],
  workbook: { sections: [] },
  quizlet_text: '',
};

test('valid Japanese lesson content passes blocking validation', () => {
  const result = validateImportedLessonContent(validContent);
  assert.deepEqual(result.errors, []);
});

test('Chinese/HSK legacy fields are rejected explicitly', () => {
  assert.throws(
    () => rejectLegacyChineseLessonFields({ lesson: { title_cn: '你好', hsk_level: 1 } }),
    /Хятад\/HSK legacy талбар/
  );
});

test('normalizer no longer treats Chinese title/text as Japanese', () => {
  assert.throws(
    () => normalizeLessonImport({
      lesson: {
        id: 'legacy-cn',
        title_cn: '你好',
        title_mn: 'Сайн байна уу',
        vocab: [['你', 'ni', 'чи', 1]],
      },
      workbook: { sections: [] },
    }),
    /Хятад\/HSK legacy талбар/
  );
});

test('publishing validation catches duplicate vocab and missing answer keys', () => {
  const result = validateImportedLessonContent({
    ...validContent,
    vocab: [validContent.vocab[0], validContent.vocab[0]],
    workbook: {
      sections: [
        {
          type: 'mcq',
          title: 'Шалгалт',
          items: [{ q: '私 гэдэг нь?', options: ['би', 'чи'] }],
        },
      ],
    },
  });
  assert.ok(result.errors.some((x) => x.includes('давхардсан үг')));
  assert.ok(result.errors.some((x) => x.includes('зөв хариулт')));
});
