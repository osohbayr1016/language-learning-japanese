import test from 'node:test';
import assert from 'node:assert/strict';
import { PLACEMENT_QUESTIONS, placementLevelFromScore } from '../src/features/setup/placement';

test('placement quiz has a short fixed question set', () => {
  assert.equal(PLACEMENT_QUESTIONS.length, 8);
  assert.ok(PLACEMENT_QUESTIONS.every((q) => q.options.length === 4));
});

test('placement score maps deterministically to advisory JLPT levels', () => {
  assert.equal(placementLevelFromScore(0), 'n5');
  assert.equal(placementLevelFromScore(2), 'n5');
  assert.equal(placementLevelFromScore(3), 'n4');
  assert.equal(placementLevelFromScore(5), 'n3');
  assert.equal(placementLevelFromScore(6), 'n2');
  assert.equal(placementLevelFromScore(7), 'n1');
  assert.equal(placementLevelFromScore(8), 'n1');
});
