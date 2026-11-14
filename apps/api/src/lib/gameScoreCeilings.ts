/**
 * Score ceilings from the currently shipped native game mechanics.
 * A submitted score must be explainable by its number of attempted words.
 * This is an anti-inflation guard, NOT proof of correct gameplay.
 */
export type GameType = "match" | "translate" | "sentence" | "stroke" | "writer";
export function maxPossibleGameScore(kind: GameType, wordsPracticed: number): number {
  if (!Number.isSafeInteger(wordsPracticed) || wordsPracticed < 1 || wordsPracticed > 500) return 0;
  if (kind === "writer") return wordsPracticed === 1 ? 100 : 0;
  if (kind === "match") return 50 * wordsPracticed; // 10 x combo capped at 5
  return 16 * wordsPracticed; // 10 base + 6 fast-answer bonus
}
export function plausibleGameScore(kind: GameType, score: number, wordsPracticed: number) {
  return Number.isSafeInteger(score) && score >= 0 &&
    score <= maxPossibleGameScore(kind, wordsPracticed);
}
