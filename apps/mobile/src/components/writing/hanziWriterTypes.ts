export type HanziWriterMode = 'animate' | 'quiz' | 'show';

export type HanziWriterEvent =
  | { type: 'ready' }
  | { type: 'mistake'; strokeNum: number; mistakesOnStroke: number }
  | { type: 'strokeComplete'; strokeNum: number; isCorrect: boolean }
  | { type: 'complete'; totalMistakes: number; strokes: number };

export type HanziWriterViewProps = {
  char: string;
  mode: HanziWriterMode;
  size?: number;
  strokeColor?: string;
  outlineColor?: string;
  strokeDataJp?: boolean;
  onEvent?: (e: HanziWriterEvent) => void;
};

export type HanziWriterHandle = {
  reset: () => void;
};
