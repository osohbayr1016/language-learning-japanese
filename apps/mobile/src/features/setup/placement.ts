import type { JlptSelfLevel } from './types';

export type PlacementLevel = Exclude<JlptSelfLevel, 'none'>;

export type PlacementQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'n5-vocab',
    prompt: '「水」 ямар утгатай вэ?',
    options: ['Гал', 'Ус', 'Салхи', 'Мод'],
    correctIndex: 1,
  },
  {
    id: 'n5-particle',
    prompt: '私___学生です。',
    options: ['を', 'に', 'は', 'で'],
    correctIndex: 2,
  },
  {
    id: 'n4-pattern',
    prompt: '音楽を聞き___勉強します。',
    options: ['ながら', 'ので', 'まで', 'しか'],
    correctIndex: 0,
  },
  {
    id: 'n4-vocab',
    prompt: '「約束」 хамгийн зөв утга аль вэ?',
    options: ['Амралт', 'Амлалт/тохиролцоо', 'Шалтгаан', 'Дурсамж'],
    correctIndex: 1,
  },
  {
    id: 'n3-pattern',
    prompt: '日本では家に入る前に靴を脱ぐ___。',
    options: ['ことになっている', 'ばかりだ', 'わけがない', 'ほどだ'],
    correctIndex: 0,
  },
  {
    id: 'n3-vocab',
    prompt: '「改善」 ямар утгатай вэ?',
    options: ['Хориглох', 'Сайжруулах', 'Харьцуулах', 'Буцаах'],
    correctIndex: 1,
  },
  {
    id: 'n2-pattern',
    prompt: '年齢___、参加できます。',
    options: ['にかかわらず', 'にしたがって', 'に対して', 'につれて'],
    correctIndex: 0,
  },
  {
    id: 'n1-pattern',
    prompt: '東京公演___、全国ツアーが始まった。',
    options: ['を皮切りに', 'をめぐって', 'に即して', 'にひきかえ'],
    correctIndex: 0,
  },
];

export function placementLevelFromScore(correct: number): PlacementLevel {
  const score = Math.max(0, Math.min(PLACEMENT_QUESTIONS.length, Math.floor(correct)));
  if (score >= 7) return 'n1';
  if (score >= 6) return 'n2';
  if (score >= 5) return 'n3';
  if (score >= 3) return 'n4';
  return 'n5';
}

export function placementLabel(level: PlacementLevel): string {
  const n = Number(level.slice(1));
  return `JLPT N${n}`;
}
