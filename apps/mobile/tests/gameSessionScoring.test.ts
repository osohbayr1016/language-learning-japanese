import test from 'node:test';
import assert from 'node:assert/strict';
import { completedMatchStats } from '../src/features/games/match/matchSessionStats';

test('match session persists the last match points instead of stale React state', () => {
  const result = completedMatchStats(70, 30, 5, 1, 6);
  assert.equal(result.score, 100);
  assert.equal(result.accuracy, 1);
});

test('multi-round accuracy includes all completed earlier chunks', () => {
  assert.deepEqual(completedMatchStats(10, 10, 10, 2, 15, 3), {
    score: 20, accuracy: 12 / 15,
  });
});

test('match accuracy accounts for mistaken attempts across rounds', () => {
  const result = completedMatchStats(70, 30, 5, 1, 6, 3);
  assert.equal(result.accuracy, 6 / 9);
});

test('match result handles an empty word pool without NaN', () => {
  assert.deepEqual(completedMatchStats(0, 0, 0, 0, 0), {
    score: 0, accuracy: 0,
  });
});
