/** Official pass thresholds; our practice proportions are not official scaled scores. */
export const JLPT = {
  N5: {
    pass: 80,
    knowledgeCap: 120,
    knowledgeMin: 38,
    readingCap: 0,
    readingMin: 0,
    listeningMin: 19,
  },
  N4: {
    pass: 90,
    knowledgeCap: 120,
    knowledgeMin: 38,
    readingCap: 0,
    readingMin: 0,
    listeningMin: 19,
  },
  N3: {
    pass: 95,
    knowledgeCap: 60,
    knowledgeMin: 19,
    readingCap: 60,
    readingMin: 19,
    listeningMin: 19,
  },
  N2: {
    pass: 90,
    knowledgeCap: 60,
    knowledgeMin: 19,
    readingCap: 60,
    readingMin: 19,
    listeningMin: 19,
  },
  N1: {
    pass: 100,
    knowledgeCap: 60,
    knowledgeMin: 19,
    readingCap: 60,
    readingMin: 19,
    listeningMin: 19,
  },
} as const;
export type JlptName = keyof typeof JLPT;
export function jlptName(band: number): JlptName {
  return (['N5', 'N4', 'N3', 'N2', 'N1'] as const)[band - 1] ?? 'N5';
}
export const JLPT_SOURCE = 'https://www.jlpt.jp/e/guideline/results.html';
