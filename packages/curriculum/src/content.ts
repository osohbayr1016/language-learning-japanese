import lessonsData from './lessons.json';
import kanjiData from './kanji.json';
import extensionLessons from './extension-lessons.json';
import extensionKanji from './extension-kanji.json';
import type { Lesson, Question, Kanji, Vocabulary, Stage } from './types';
// Append only: stored answer indices and existing course events depend on stable IDs/content.
export const LESSONS = [...lessonsData, ...extensionLessons] as Lesson[];
export const KANJI = [...kanjiData, ...extensionKanji] as Kanji[];
export const COURSE_STAGES: readonly Stage[] = ['hiragana', 'katakana', 'n5', 'n4'];
export const STAGE_LABELS: Record<Stage, string> = {
  hiragana: 'Хирагана', katakana: 'Катакана', n5: 'N5 суурь', n4: 'N4 суурь',
};
export function isKanaStage(stage: Stage): boolean {
  return stage === 'hiragana' || stage === 'katakana';
}
export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));
export const WORDS = new Map(
  LESSONS.flatMap((l) => l.words).map((w) => [w.id, w]),
);
export const REQUIRED_TASKS = ['words', 'reading', 'writing', 'quiz'] as const;
const HIRA =
  'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const ROMAJI =
  'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n'.split(
    ' ',
  );
export const HIRAGANA_PLACEMENT: Question[] = Array.from(HIRA).map(
  (glyph, i) => {
    const distractors = [ROMAJI[(i + 7) % 46], ROMAJI[(i + 17) % 46]];
    const options = [...distractors];
    options.splice(i % 3, 0, ROMAJI[i]);
    return {
      prompt: glyph,
      options,
      answer: i % 3,
      explanation: `${glyph} → ${ROMAJI[i]}`,
    };
  },
);
// Deliberately distinct options, with answer position distributed across the exercise.
export function wordQuestions(words: Vocabulary[]): Question[] {
  return words.map((w, i) => {
    const distractors = words
      .filter((x) => x.mn !== w.mn)
      .slice(0, 2)
      .map((x) => x.mn);
    const options = [...distractors];
    const answer = i % (options.length + 1);
    options.splice(answer, 0, w.mn);
    return {
      prompt: w.jp,
      options,
      answer,
      explanation: `${w.jp}（${w.kana}）= ${w.mn}`,
    };
  });
}
export function lessonQuestions(l: Lesson): Question[] {
  return [...wordQuestions(l.words), l.grammarQuestion];
}
export function writingCharacters(l: Lesson): string[] {
  return Array.from(new Set(l.glyphs.join('')))
    .filter((c) => c !== 'ー')
    .slice(0, 5);
}
