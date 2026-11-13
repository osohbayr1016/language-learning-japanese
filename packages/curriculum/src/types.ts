export type Stage = "hiragana" | "katakana" | "n5" | "n4";
export type Task =
  | "words"
  | "reading"
  | "writing"
  | "quiz"
  | "listening"
  | "speaking";
export type Question = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};
export type Vocabulary = {
  id: string;
  jp: string;
  kana: string;
  romaji: string;
  mn: string;
};
export type Kanji = {
  char: string;
  mn: string;
  on: string;
  kun: string;
  example: string;
  reading: string;
};
export type Lesson = {
  id: string;
  stage: Stage;
  title: string;
  objective: string;
  glyphs: string[];
  words: Vocabulary[];
  grammar: string;
  passage: string;
  /** Optional kana support; the original Japanese passage remains the reading target. */
  passageKana?: string;
  translation: string;
  readingQuestion: Question;
  grammarQuestion: Question;
};
export type Preferences = {
  minutes: number;
  daysPerWeek: number;
  timezone: string;
  target: "N5" | "N4" | "N3" | "N2" | "N1";
  examDate?: string;
};
export type CourseEvent = {
  id: string;
  at: string;
  day: string;
} & (
  | { kind: "plan"; lessonId: string; reviews: string[] }
  | {
      kind: "task" | "attempt";
      lessonId: string;
      task: Task;
      answers?: number[];
      characters?: string[];
      transcript?: string;
    }
  | {
      kind: "remedy";
      lessonId: string;
      task: Task;
      question: number;
      answer: number;
    }
  | {
      kind: "fluency";
      script: "hiragana" | "katakana";
      correct: number;
      total: number;
      seconds: number;
    }
  | { kind: "dialogue"; clipId: string; answer: number }
  | { kind: "expose"; wordId: string }
  | { kind: "review"; wordId: string; rating: 0 | 1 | 2 | 3 }
  | { kind: "placement"; answers: number[] }
  | { kind: "study"; seconds: number }
);
export const DEFAULT_PREFERENCES: Preferences = {
  minutes: 20,
  daysPerWeek: 7,
  timezone: "Asia/Ulaanbaatar",
  target: "N2",
};

export type EventInput = CourseEvent extends infer E
  ? E extends CourseEvent
    ? Omit<E, "id" | "at" | "day">
    : never
  : never;
