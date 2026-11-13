import type { ImportedLessonContent } from '../../lib/types';

export type ImportedVocabRow = ImportedLessonContent['vocab'][number];

export function graphemeCount(kanji: string): number {
  return [...kanji.trim()].length;
}

export function kanjiRows(vocab: ImportedVocabRow[]): ImportedVocabRow[] {
  return vocab.filter((row) => graphemeCount(row.kanji) === 1);
}

export function phraseRows(vocab: ImportedVocabRow[]): ImportedVocabRow[] {
  return vocab.filter((row) => graphemeCount(row.kanji) > 1);
}
