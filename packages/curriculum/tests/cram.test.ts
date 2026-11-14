import test from "node:test";
import assert from "node:assert/strict";
import {
  LESSONS, wordQuestions, eligibleCramWords, buildCramQuestions,
  type CourseEvent,
} from "../src";

const first = LESSONS.find(l => l.stage === "hiragana")!;
const event: CourseEvent = {
  id: "cram_eligible_0001",
  kind: "task",
  task: "words",
  lessonId: first.id,
  at: new Date().toISOString(),
  day: "2026-11-14",
  answers: wordQuestions(first.words).map(q => q.answer),
};

test("cram exposes only words from passed introduction lessons", () => {
  assert.equal(eligibleCramWords([], "hiragana").length, 0);
  assert.equal(eligibleCramWords([event], "n5").length, 0);
  assert.ok(eligibleCramWords([event], "hiragana").length >= 1);
});

test("cram questions have valid answer choices and do not modify progress", () => {
  const originals = JSON.stringify([event]);
  const questions = buildCramQuestions([event], "hiragana", 10, () => 0.5);
  assert.ok(questions.length > 0 && questions.length <= 10);
  questions.forEach(q => assert.ok(q.answer >= 0 && q.answer < q.options.length));
  assert.equal(JSON.stringify([event]), originals);
  assert.deepEqual(buildCramQuestions([], "n4"), []);
});
