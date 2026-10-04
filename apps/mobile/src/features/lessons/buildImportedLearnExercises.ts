import type { ImportedLessonContent } from '../../lib/types';
import type { Exercise, ImportedLearnSection } from './types';
import { kanjiRows, phraseRows } from './importedVocabRows';

function pushIf(
  out: Exercise[],
  section: ImportedLearnSection,
  content: ImportedLessonContent,
  ok: boolean
) {
  if (!ok) return;
  out.push({
    kind: 'imported-section',
    id: `imported-${section}-${content.external_lesson_id}`,
    section,
    content,
  });
}

export function buildImportedLearnExercises(content: ImportedLessonContent): Exercise[] {
  const out: Exercise[] = [];
  const kRows = kanjiRows(content.vocab);
  const pRows = phraseRows(content.vocab);
  const hasEasy = content.dialogues.some((d) => Boolean(d.text_jp?.trim()));
  const hasDialogueLines = content.dialogues.some((d) => (d.lines?.length ?? 0) > 0);

  pushIf(out, 'summary', content, Boolean(content.summary?.trim()));
  pushIf(out, 'kanjis', content, kRows.length > 0);
  pushIf(out, 'phrases', content, pRows.length > 0);
  pushIf(out, 'easy-texts', content, hasEasy);
  pushIf(out, 'dialogue', content, hasDialogueLines);
  pushIf(out, 'grammar', content, content.grammar.length > 0);
  pushIf(out, 'slang', content, content.slang.length > 0);

  if (out.length === 0) {
    pushIf(out, 'summary', content, true);
  }

  out.push({
    kind: 'in-lesson-games-hub',
    id: `hub-${content.external_lesson_id}`,
    content,
  });

  return out;
}
