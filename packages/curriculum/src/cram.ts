import {
  LESSONS, taskDone, wordQuestions,
  type Stage, type CourseEvent, type Question, type Vocabulary,
} from "./index";

/** Only vocabulary that has actually passed its introduction task is eligible. */
export function eligibleCramWords(events: readonly CourseEvent[], stage: Stage): Vocabulary[] {
  const seen = new Set<string>();
  return LESSONS
    .filter(lesson => lesson.stage === stage && taskDone(events, lesson.id, "words"))
    .flatMap(lesson => lesson.words)
    .filter(word => {
      const key = word.jp + "\u0000" + word.kana;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Ephemeral review: do not write task, SRS, review, XP or mastery events. */
export function buildCramQuestions(
  events: readonly CourseEvent[],
  stage: Stage,
  limit = 10,
  random: () => number = Math.random,
): Question[] {
  const pool = wordQuestions(eligibleCramWords(events, stage));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.max(0, Math.min(i, Math.floor(random() * (i + 1))));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(20, Math.max(0, Math.floor(limit))));
}
