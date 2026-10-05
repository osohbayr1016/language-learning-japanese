import React from 'react';
import type { Exercise } from '../types';
import { MemorizeCard } from './MemorizeCard';
import { ChooseWordMcq } from './ChooseWordMcq';
import { ListenMcq } from './ListenMcq';
import { MatchPairs } from './MatchPairs';
import { ArrangeWords } from './ArrangeWords';
import { FillBlank } from './FillBlank';
import { TrueFalse } from './TrueFalse';
import { SaySentence } from './SaySentence';
import { ImportedWorkbookCard } from './ImportedWorkbookCard';
import { ImportedSectionCard } from '../importedSections/ImportedSectionCard';
import { mn } from '../../../i18n/mn';
import type { WordWithProgress } from '../../../lib/types';

type Props = {
  exercise: Exercise;
  lessonWords?: WordWithProgress[];
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
};

export function ExerciseRenderer({ exercise, lessonWords, disabled, onAnswer }: Props) {
  switch (exercise.kind) {
    case 'memorize':
      return <MemorizeCard exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case 'choose-word':
      return <ChooseWordMcq exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case 'listen-mcq':
      return <ListenMcq exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case 'match-pairs':
      return <MatchPairs exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case 'arrange-words':
      return <ArrangeWords exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case 'fill-blank':
      return <FillBlank exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case 'true-false':
      return <TrueFalse exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case 'say-sentence':
      return <SaySentence exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case 'imported-section':
      return (
        <ImportedSectionCard
          exercise={exercise}
          lessonWords={lessonWords}
          disabled={disabled}
          onAnswer={onAnswer}
        />
      );
    case 'imported-workbook':
      return <ImportedWorkbookCard exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case 'in-lesson-games-hub':
      return null;
  }
}

export function exercisePromptFor(exercise: Exercise): string {
  switch (exercise.kind) {
    case 'memorize':
      return 'Энэ үгийг сайн цээжил';
    case 'choose-word':
      return `"${exercise.word.meaning_mn}" гэдэг үг аль вэ?`;
    case 'listen-mcq':
      return 'Юу сонсогдов?';
    case 'match-pairs':
      return 'Хоёроо тааруул';
    case 'arrange-words':
      return 'Энэ өгүүлбэрийг бүтээ';
    case 'fill-blank':
      return 'Дутуу үгийг бөглө';
    case 'true-false':
      return 'Энэ үнэн үү?';
    case 'say-sentence':
      return 'Дээрх өгүүлбэрийг хэлж сонсго';
    case 'imported-section':
      return mn.lesson.importedSectionPrompt[exercise.section];
    case 'imported-workbook':
      return exercise.sectionTitle;
    case 'in-lesson-games-hub':
      return 'Хичээлээ тоглоомоор бататгах';
  }
}

export function exerciseCorrectAnswer(exercise: Exercise): string {
  switch (exercise.kind) {
    case 'memorize':
      return exercise.word.kanji;
    case 'choose-word':
    case 'listen-mcq':
    case 'fill-blank':
      return `${exercise.word.kanji} (${exercise.word.romaji})`;
    case 'arrange-words':
      return exercise.word.example_jp ?? exercise.word.kanji;
    case 'match-pairs':
      return exercise.pairs.map((w) => w.kanji).join(' · ');
    case 'true-false':
      return exercise.isTrue ? 'Үнэн' : 'Худал';
    case 'say-sentence':
      return exercise.word.example_jp ?? exercise.word.kanji;
    case 'imported-section':
      return 'Үзсэн';
    case 'imported-workbook':
      return exercise.item.answer == null ? 'Дасгал уншсан' : String(exercise.item.answer);
    case 'in-lesson-games-hub':
      return 'Тоглоом дууссан';
  }
}
