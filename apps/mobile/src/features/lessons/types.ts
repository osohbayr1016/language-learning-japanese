import type { ImportedLessonContent, ImportedWorkbookItem, WordWithProgress } from '../../lib/types';

export type ImportedLearnSection =
  | 'summary'
  | 'kanjis'
  | 'phrases'
  | 'easy-texts'
  | 'dialogue'
  | 'grammar'
  | 'slang';

export type ExerciseKind =
  | 'memorize'
  | 'choose-word'
  | 'listen-mcq'
  | 'match-pairs'
  | 'arrange-words'
  | 'fill-blank'
  | 'true-false'
  | 'say-sentence'
  | 'imported-section'
  | 'imported-workbook'
  | 'in-lesson-games-hub';

export type Exercise =
  | { kind: 'memorize'; id: string; word: WordWithProgress }
  | {
      kind: 'choose-word';
      id: string;
      word: WordWithProgress;
      options: WordWithProgress[];
    }
  | {
      kind: 'listen-mcq';
      id: string;
      word: WordWithProgress;
      options: WordWithProgress[];
    }
  | { kind: 'match-pairs'; id: string; pairs: WordWithProgress[] }
  | { kind: 'arrange-words'; id: string; word: WordWithProgress }
  | {
      kind: 'fill-blank';
      id: string;
      word: WordWithProgress;
      options: WordWithProgress[];
    }
  | {
      kind: 'true-false';
      id: string;
      word: WordWithProgress;
      shownMeaning: string;
      isTrue: boolean;
    }
  | { kind: 'say-sentence'; id: string; word: WordWithProgress }
  | { kind: 'imported-section'; id: string; section: ImportedLearnSection; content: ImportedLessonContent }
  | {
      kind: 'imported-workbook';
      id: string;
      sectionTitle: string;
      sectionType: string;
      item: ImportedWorkbookItem;
      bank?: string[];
    }
  | {
      kind: 'in-lesson-games-hub';
      id: string;
      content: ImportedLessonContent;
    };

export type ExerciseResult = {
  exerciseId: string;
  wordIds: number[];
  correct: boolean;
  responseMs: number;
};

export type LessonStatus = 'loading' | 'running' | 'done' | 'error';

export function isImportedLearnFlow(exercises: Exercise[]): boolean {
  return exercises.length > 0 && exercises.every((e) => e.kind === 'imported-section' || e.kind === 'in-lesson-games-hub');
}

const IMPORTED_SECTION_TITLES: Record<ImportedLearnSection, string> = {
  summary: 'Товч агуулга',
  kanjis: 'Шинэ канжи',
  phrases: 'Хэллэгүүд',
  'easy-texts': 'Хялбар уншлага',
  dialogue: 'Харилцан яриа',
  grammar: 'Дүрэм',
  slang: 'Ярианы хэллэг',
};

export const EXERCISE_TITLES: Record<Exclude<ExerciseKind, 'imported-section'>, string> = {
  memorize: 'Цээжлэх',
  'choose-word': 'Үг сонго',
  'listen-mcq': 'Сонсоод сонго',
  'match-pairs': 'Тааруулах',
  'arrange-words': 'Үгээр зохио',
  'fill-blank': 'Дутууг бөглө',
  'true-false': 'Үнэн худал',
  'say-sentence': 'Хэлж сонсго',
  'imported-workbook': 'Дасгал',
  'in-lesson-games-hub': 'Тоглоом',
};

export function exerciseDisplayTitle(ex: Exercise): string {
  if (ex.kind === 'imported-section') return IMPORTED_SECTION_TITLES[ex.section];
  return EXERCISE_TITLES[ex.kind];
}
