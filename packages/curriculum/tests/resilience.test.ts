import test from "node:test";
import assert from "node:assert/strict";
import {
  parseSaved,
  DEFAULT_PREFERENCES,
  validateEvent,
  missedQuestions,
  courseSummary,
  milestones,
  dailyRecommendation,
  LESSONS,
  wordQuestions,
  type CourseEvent,
} from "../src";
const base = { at: "2026-01-01T01:00:00.000Z", day: "2026-01-01" };
const e = (data: object) =>
  ({ ...base, id: crypto.randomUUID(), ...data }) as CourseEvent;
test("valid progress above the old 20000-event boundary is never reset", () => {
  const events = Array.from({ length: 20010 }, () =>
    e({ kind: "study", seconds: 60 }),
  );
  assert.equal(
    parseSaved(
      JSON.stringify({ version: 1, events, preferences: DEFAULT_PREFERENCES }),
    ).events.length,
    events.length,
  );
});
test("failed attempts enter the mistake notebook and a specific remedy clears only that question", () => {
  const l = LESSONS[0],
    qs = wordQuestions(l.words);
  const attempt = e({
    kind: "attempt",
    lessonId: l.id,
    task: "words",
    answers: qs.map((q) => (q.answer + 1) % q.options.length),
  });
  assert.ok(validateEvent(attempt));
  assert.equal(missedQuestions([attempt]).length, 3);
  const remedy = e({
    kind: "remedy",
    lessonId: l.id,
    task: "words",
    question: 0,
    answer: qs[0].answer,
    at: "2026-01-02T01:00:00.000Z",
    day: "2026-01-02",
  });
  assert.ok(validateEvent(remedy));
  assert.equal(missedQuestions([attempt, remedy]).length, 2);
  assert.equal(
    courseSummary([attempt, remedy], DEFAULT_PREFERENCES).completed,
    0,
  );
});
test("review and recognition days count for continuity while acoustic mastery is never invented", () => {
  const event = e({
    kind: "fluency",
    script: "katakana",
    correct: 18,
    total: 20,
    seconds: 35,
  });
  assert.ok(validateEvent(event));
  const summary = courseSummary(
    [event],
    DEFAULT_PREFERENCES,
    new Date("2026-01-01T02:00:00Z"),
  );
  assert.equal(summary.currentStreak, 1);
  assert.equal(summary.words, 0);
  assert.equal(summary.characters, 0);
});
test("forecast learns actual recent minutes and pauses rather than inventing a date after inactivity", () => {
  const now = new Date("2026-02-01T00:00:00Z");
  const events = [e({ kind: "study", seconds: 60 })];
  const paused = milestones(events, DEFAULT_PREFERENCES, now);
  assert.equal(paused[0].basis, "paused");
  assert.equal(paused[0].earliest, null);
  const study = e({
    kind: "study",
    seconds: 300,
    at: "2026-01-31T01:00:00.000Z",
    day: "2026-01-31",
  });
  const observed = milestones(
    [...events, study],
    { ...DEFAULT_PREFERENCES, minutes: 60 },
    now,
  );
  assert.equal(observed[0].basis, "observed");
  assert.ok(observed[0].weeklyHours < 1);
});
test("a review backlog after a break proposes catch-up before more vocabulary", () => {
  const l = LESSONS[0];
  const event = e({
    kind: "task",
    lessonId: l.id,
    task: "words",
    answers: wordQuestions(l.words).map((q) => q.answer),
  });
  const advice = dailyRecommendation(
    [event],
    DEFAULT_PREFERENCES,
    new Date("2026-01-10T00:00:00Z"),
  );
  assert.equal(advice.due, 3);
  assert.equal(advice.catchUp, false);
  const backlog = LESSONS.slice(0, 4).map((l) =>
    e({
      kind: "task",
      lessonId: l.id,
      task: "words",
      answers: wordQuestions(l.words).map((q) => q.answer),
    }),
  );
  const returning = dailyRecommendation(
    backlog,
    DEFAULT_PREFERENCES,
    new Date("2026-01-10T00:00:00Z"),
  );
  assert.ok(returning.due >= 8);
  assert.equal(returning.catchUp, true);
  assert.equal(returning.newWords, 0);
});

test("original listening dialogues have stable choices and valid, non-mastery evidence", async () => {
  const { LISTENING_DIALOGUES, DIALOGUE_BY_ID } = await import("../src");
  assert.equal(LISTENING_DIALOGUES.length, 12);
  assert.equal(DIALOGUE_BY_ID.size, 12);
  for (const clip of LISTENING_DIALOGUES) {
    assert.ok(clip.kana.length > 10 && clip.kana.length < 1000);
    assert.ok(!/\p{Script=Han}/u.test(clip.kana));
    assert.ok(clip.question.options[clip.question.answer]);
    assert.equal(
      new Set(clip.question.options).size,
      clip.question.options.length,
    );
    assert.ok(clip.question.explanation.length > 10);
    const result = e({
      kind: "dialogue",
      clipId: clip.id,
      answer: clip.question.answer,
    });
    assert.ok(validateEvent(result));
    assert.equal(courseSummary([result], DEFAULT_PREFERENCES).completed, 0);
  }
  assert.equal(
    validateEvent(e({ kind: "dialogue", clipId: "not-published", answer: 0 })),
    false,
  );
  assert.equal(
    validateEvent(
      e({ kind: "dialogue", clipId: LISTENING_DIALOGUES[0].id, answer: 99 }),
    ),
    false,
  );
});
