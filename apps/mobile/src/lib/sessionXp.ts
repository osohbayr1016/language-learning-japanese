import { calculateXP } from "@japanese-learning/srs";

/** Include the final answer before React commits the next correctCount state. */
export function sessionXpIncludingFinal(
  type: "flashcard" | "write",
  correctBeforeFinal: number,
  finalIsCorrect: boolean,
  total: number,
): number {
  return calculateXP({
    type,
    correct: correctBeforeFinal + (finalIsCorrect ? 1 : 0),
    total,
  });
}
