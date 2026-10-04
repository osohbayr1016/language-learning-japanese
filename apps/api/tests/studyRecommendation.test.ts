import test from 'node:test';
import assert from 'node:assert/strict';
import { selectStudyAction } from '../src/lib/studyRecommendation';

test('due reviews always win over lessons and weak skills', () => {
  const action = selectStudyAction({
    dueCount: 7,
    nextLessonId: 42,
    weakSkill: 'reading',
  });
  assert.equal(action.kind, 'review');
  assert.equal(action.href, '/study/flashcard');
  assert.equal(action.due_count, 7);
});

test('next unfinished lesson is selected when review queue is clear', () => {
  const action = selectStudyAction({
    dueCount: 0,
    nextLessonId: 42,
    weakSkill: 'reading',
  });
  assert.equal(action.kind, 'lesson');
  assert.equal(action.href, '/lessons/42');
  assert.equal(action.lesson_id, 42);
});

test('weakest measured skill is selected when there is no due review or lesson', () => {
  const action = selectStudyAction({
    dueCount: 0,
    nextLessonId: null,
    weakSkill: 'stroke',
  });
  assert.equal(action.kind, 'weak_skill');
  assert.equal(action.href, '/study/writer');
  assert.equal(action.weak_skill, 'stroke');
});

test('safe kana exploration is used when the learner has nothing else queued', () => {
  const action = selectStudyAction({
    dueCount: 0,
    nextLessonId: null,
    weakSkill: null,
  });
  assert.equal(action.kind, 'explore');
  assert.equal(action.href, '/kana');
});

test('complete beginner gets kana foundation before an ordinary lesson', () => {
  const action = selectStudyAction({
    dueCount: 0,
    needsKanaFoundation: true,
    nextLessonId: 42,
    weakSkill: null,
    learningReason: 'fun',
  });
  assert.equal(action.kind, 'foundation');
  assert.equal(action.href, '/kana');
});

test('learning reason changes exploration after required work is clear', () => {
  const travel = selectStudyAction({
    dueCount: 0,
    nextLessonId: null,
    weakSkill: null,
    learningReason: 'travel',
  });
  assert.equal(travel.href, '/study/speak');

  const career = selectStudyAction({
    dueCount: 0,
    nextLessonId: null,
    weakSkill: null,
    learningReason: 'career',
  });
  assert.equal(career.href, '/study/grammar');

  const culture = selectStudyAction({
    dueCount: 0,
    nextLessonId: null,
    weakSkill: null,
    learningReason: 'culture',
  });
  assert.equal(culture.href, '/study/ai-reading');
});

test('due review still wins over a placement checkpoint', () => {
  const action = selectStudyAction({
    dueCount: 2,
    needsN5Checkpoint: true,
    nextLessonId: 42,
    weakSkill: null,
  });
  assert.equal(action.kind, 'review');
});

test('high placement routes through the N5 checkpoint before an ordinary lesson', () => {
  const action = selectStudyAction({
    dueCount: 0,
    needsN5Checkpoint: true,
    nextLessonId: 42,
    weakSkill: null,
  });
  assert.equal(action.kind, 'checkpoint');
  assert.equal(action.href, '/study/mock-exam');
  assert.equal(action.reason, 'placement_requires_n5_checkpoint');
});
