import type { Word } from '../types';
import type { SpeechTarget } from './speechScoring';

export type SpeechPromptScope = 'word' | 'example';

/** What the learner is asked to say, and everything needed to grade it. */
export function getSpeechDisplay(word: Word, speechPrompt: SpeechPromptScope): SpeechTarget {
  if (speechPrompt === 'example' && word.example_jp) {
    return {
      jp: word.example_jp,
      // Example sentences carry no kana column; romaji is the only reading.
      kana: '',
      romaji: word.example_romaji ?? word.romaji ?? '',
    };
  }
  return {
    jp: word.kanji,
    kana: word.kana ?? '',
    romaji: word.romaji ?? '',
  };
}

/**
 * Phrases handed to the recognizer as contextual hints. Feeding it both the
 * kanji and the kana reading biases `ja-JP` away from homophone spellings.
 */
export function speechRecognitionHints(word: Word, displayJp: string): string[] {
  return [
    ...new Set(
      [displayJp, word.kanji, word.kana, word.example_jp].filter(Boolean) as string[]
    ),
  ];
}
