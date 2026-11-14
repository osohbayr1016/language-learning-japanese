/**
 * Calculate the final result using all rounds, including the last matched pair.
 * React state updates for the final tap are asynchronous, so the component must
 * not read the previous score/matched-pair state while persisting the session.
 */
export function completedMatchStats(
  scoreBeforeLast: number,
  finalPairPoints: number,
  completedBeforeRound: number,
  matchedInFinalRound: number,
  totalPairs: number,
  wrongAttempts = 0,
) {
  const score = Math.max(0, scoreBeforeLast + finalPairPoints);
  const completed = Math.max(0, completedBeforeRound + matchedInFinalRound);
  const matched = Math.min(completed, Math.max(0, totalPairs));
  const attempts = matched + Math.max(0, wrongAttempts);
  const accuracy = attempts > 0 ? matched / attempts : 0;
  return { score, accuracy };
}
