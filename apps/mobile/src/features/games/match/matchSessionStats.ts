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
) {
  const score = Math.max(0, scoreBeforeLast + finalPairPoints);
  const completed = Math.max(0, completedBeforeRound + matchedInFinalRound);
  const accuracy = totalPairs > 0 ? Math.min(1, completed / totalPairs) : 0;
  return { score, accuracy };
}
