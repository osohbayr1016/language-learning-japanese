import React from 'react';
import { JapaneseSpeechCard } from '../../../components/practice/JapaneseSpeechCard';
import type { Exercise } from '../types';

type Props = {
  exercise: Extract<Exercise, { kind: 'say-sentence' }>;
  disabled: boolean;
  onAnswer: (correct: boolean) => void;
};

export function SaySentence({ exercise, disabled, onAnswer }: Props) {
  return (
    <JapaneseSpeechCard
      word={exercise.word}
      disabled={disabled}
      speechPrompt="example"
      onEvaluated={onAnswer}
    />
  );
}
