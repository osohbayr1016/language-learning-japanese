import type { Exercise, ExerciseResult } from './types';

export type SkillKey =
  | 'listening'
  | 'pronunciation'
  | 'pitch'
  | 'recall'
  | 'reading'
  | 'stroke';

const KIND_TO_SKILLS: Record<Exercise['kind'], SkillKey[]> = {
  memorize: ['recall', 'reading'],
  'choose-word': ['recall', 'reading'],
  'listen-mcq': ['listening', 'pitch'],
  'match-pairs': ['recall', 'reading'],
  'arrange-words': ['reading', 'recall'],
  'fill-blank': ['recall', 'reading'],
  'true-false': ['recall'],
  'say-sentence': ['pronunciation', 'pitch', 'listening'],
  'imported-section': ['reading'],
  'imported-workbook': ['reading', 'recall'],
  'in-lesson-games-hub': [],
};

export type SkillScores = Record<SkillKey, number>;
export type SkillCounts = Record<SkillKey, { hits: number; total: number }>;

export function computeSkillCounts(
  exercises: Exercise[],
  results: ExerciseResult[]
): SkillCounts {
  const totals: SkillCounts = {
    listening: { hits: 0, total: 0 },
    pronunciation: { hits: 0, total: 0 },
    pitch: { hits: 0, total: 0 },
    recall: { hits: 0, total: 0 },
    reading: { hits: 0, total: 0 },
    stroke: { hits: 0, total: 0 },
  };

  const byId = new Map<string, Exercise>();
  for (const ex of exercises) byId.set(ex.id, ex);

  for (const r of results) {
    const ex = byId.get(r.exerciseId);
    if (!ex) continue;
    const skills = KIND_TO_SKILLS[ex.kind];
    for (const s of skills) {
      totals[s].total += 1;
      if (r.correct) totals[s].hits += 1;
    }
  }

  return totals;
}

export function computeSkills(
  exercises: Exercise[],
  results: ExerciseResult[]
): SkillScores {
  const counts = computeSkillCounts(exercises, results);
  const out: SkillScores = {
    listening: 0, pronunciation: 0, pitch: 0, recall: 0, reading: 0, stroke: 0,
  };
  for (const k of Object.keys(counts) as SkillKey[]) {
    const t = counts[k];
    out[k] = t.total === 0 ? 0 : t.hits / t.total;
  }
  return out;
}
