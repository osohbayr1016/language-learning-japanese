import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLessonXp, lessonIsMastered } from '../src/lib/lessonCompletion';

test('lesson mastery requires at least 80 percent accuracy', () => {
  assert.equal(lessonIsMastered(0.79), false);
  assert.equal(lessonIsMastered(0.8), true);
  assert.equal(lessonIsMastered(1), true);
});

test('lesson XP is derived from accuracy and lesson size, not client input', () => {
  assert.equal(calculateLessonXp(1, 10), 100);
  assert.equal(calculateLessonXp(0.5, 10), 50);
  assert.equal(calculateLessonXp(1, 100), 300);
  assert.equal(calculateLessonXp(0, 10), 0);
});
