import test from "node:test";
import assert from "node:assert/strict";
import { sessionXpIncludingFinal } from "../src/lib/sessionXp";
import { calculateXP } from "@japanese-learning/srs";

test("flashcard final answer can cross the 90% multiplier boundary", () => {
  assert.equal(
    sessionXpIncludingFinal("flashcard", 8, true, 10),
    calculateXP({ type: "flashcard", correct: 9, total: 10 }),
  );
  assert.notEqual(
    sessionXpIncludingFinal("flashcard", 8, true, 10),
    calculateXP({ type: "flashcard", correct: 8, total: 10 }) + 5,
  );
});

test("writing final correct answer is included in awarded XP", () => {
  assert.equal(
    sessionXpIncludingFinal("write", 3, true, 4),
    calculateXP({ type: "write", correct: 4, total: 4 }),
  );
  assert.equal(
    sessionXpIncludingFinal("write", 3, false, 4),
    calculateXP({ type: "write", correct: 3, total: 4 }),
  );
});
