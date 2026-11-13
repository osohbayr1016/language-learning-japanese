export type KanjiWriterMode = 'animate' | 'quiz' | 'show';

export type KanjiWriterEvent =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'mistake'; strokeNum: number; mistakesOnStroke: number }
  | { type: 'strokeComplete'; strokeNum: number; isCorrect: boolean }
  | { type: 'complete'; totalMistakes: number; strokes: number };

export type KanjiWriterViewProps = {
  char: string;
  mode: KanjiWriterMode;
  size?: number;
  strokeColor?: string;
  outlineColor?: string;
  strokeDataJp?: boolean;
  onEvent?: (e: KanjiWriterEvent) => void;
};

export type KanjiWriterHandle = {
  reset: () => void;
};
