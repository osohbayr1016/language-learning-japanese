export type SpeechState = 'idle' | 'requesting' | 'listening' | 'processing' | 'error';
export type SpeechResult = {
  transcript: string;
  confidence: number;
  /** Lower-ranked hypotheses — Japanese homophones often differ only here. */
  alternatives?: string[];
};

/** Continuous-session buffer: text committed so far plus the pending preview. */
export type SpeechBuffer = {
  committed: string;
  preview: string;
  /** Full-utterance variants built from the last segment's alternatives. */
  alternatives: string[];
};

export const EMPTY_SPEECH_BUFFER: SpeechBuffer = { committed: '', preview: '', alternatives: [] };
