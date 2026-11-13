import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LESSONS,
  KANJI,
  REQUIRED_TASKS,
  HIRAGANA_PLACEMENT,
  DEFAULT_PREFERENCES,
  wordQuestions,
  lessonQuestions,
  writingCharacters,
  validateEvent,
  canStudy,
  mastered,
  nextLesson,
  hiraPlaced,
  mergeEvents,
  reviewCards,
  dueReviews,
  localDay,
  planForDay,
  milestones,
  type CourseEvent,
} from '../src';
import { matchesStroke } from '../src/strokes';
import counts from '../src/stroke-counts.json';
const base = { at: '2026-01-01T01:00:00.000Z', day: '2026-01-01' };
let serial = 0;
function event(data: object): CourseEvent {
  return {
    ...base,
    id: 'event_' + String(++serial).padStart(8, '0'),
    ...data,
  } as CourseEvent;
}
function complete(id: string) {
  const l = LESSONS.find((l) => l.id === id)!;
  return [
    event({
      kind: 'task',
      lessonId: id,
      task: 'words',
      answers: wordQuestions(l.words).map((q) => q.answer),
    }),
    event({
      kind: 'task',
      lessonId: id,
      task: 'reading',
      answers: [l.readingQuestion.answer],
    }),
    event({
      kind: 'task',
      lessonId: id,
      task: 'writing',
      characters: writingCharacters(l),
    }),
    event({
      kind: 'task',
      lessonId: id,
      task: 'quiz',
      answers: lessonQuestions(l).map((q) => q.answer),
    }),
  ];
}
test('curriculum has distinct lessons, real answers, and Japanese writing data', () => {
  assert.equal(LESSONS.length, 50);
  assert.equal(new Set(LESSONS.map((l) => l.id)).size, 50);
  assert.equal(KANJI.length, 102);
  for (const l of LESSONS) {
    for (const q of [...lessonQuestions(l), l.readingQuestion]) {
      assert.ok(q.options.length >= 2, l.id);
      assert.equal(new Set(q.options).size, q.options.length, l.id);
      assert.ok(q.answer >= 0 && q.answer < q.options.length, l.id);
      assert.ok(q.explanation.length > 0, l.id);
    }
    for (const c of Array.from(l.glyphs.join('')).filter((c) => c !== 'ー'))
      assert.ok((counts as Record<string, number>)[c], l.id + ' missing ' + c);
  }
  for (const k of KANJI)
    assert.ok((counts as Record<string, number>)[k.char], k.char);
});
test('all 46 modern base kana are taught in each script', () => {
  for (const stage of ['hiragana', 'katakana'])
    assert.equal(
      LESSONS.filter((l) => l.stage === stage)
        .slice(0, 10)
        .flatMap((l) => l.glyphs).length,
      46,
    );
});
test('only meaningful completion evidence advances a lesson', () => {
  const first = LESSONS[0];
  assert.equal(nextLesson([])?.id, first.id);
  assert.equal(canStudy([], LESSONS[1].id), false);
  const e = complete(first.id);
  for (const task of REQUIRED_TASKS)
    assert.equal(
      mastered(
        e.filter((x) => x.kind !== 'task' || x.task !== task),
        first.id,
      ),
      false,
    );
  assert.equal(mastered(e, first.id), true);
  assert.equal(nextLesson(e)?.id, LESSONS[1].id);
  assert.equal(canStudy(e, LESSONS[1].id), true);
  assert.equal(canStudy(e, 'not-found'), false);
});
test('hiragana placement requires ninety percent and does not skip katakana', () => {
  assert.equal(
    hiraPlaced([
      event({
        kind: 'placement',
        answers: HIRAGANA_PLACEMENT.map((q) => (q.answer + 1) % 3),
      }),
    ]),
    false,
  );
  const placed = [
    event({
      kind: 'placement',
      answers: HIRAGANA_PLACEMENT.map((q) => q.answer),
    }),
  ];
  assert.equal(hiraPlaced(placed), true);
  assert.equal(nextLesson(placed)?.id, 'katakana-01');
  assert.equal(canStudy(placed, 'n5-01'), false);
});
test('events reject unknown content, oversized answers and impossible study times', () => {
  assert.equal(
    validateEvent(
      event({ kind: 'task', lessonId: 'other', task: 'words', answers: [] }),
    ),
    false,
  );
  assert.equal(
    validateEvent(
      event({
        kind: 'task',
        lessonId: LESSONS[0].id,
        task: 'words',
        answers: [99, 0, 0],
      }),
    ),
    false,
  );
  assert.equal(validateEvent(event({ kind: 'study', seconds: 301 })), false);
  assert.equal(validateEvent(event({ kind: 'study', seconds: 60 })), true);
  assert.equal(
    validateEvent({
      ...event({ kind: 'study', seconds: 60 }),
      at: '3000-01-01T00:00:00Z',
    }),
    false,
  );
});
test('merging exports is idempotent and preserves both devices', () => {
  const a = event({ kind: 'study', seconds: 60 }),
    b = event({ kind: 'study', seconds: 20 });
  assert.deepEqual(mergeEvents([a], [a, b]), mergeEvents([a, b], []));
  assert.equal(mergeEvents([a], [a, b]).length, 2);
});
test('only exposed vocabulary enters SRS; lapses return sooner', () => {
  assert.equal(reviewCards([]).length, 0);
  const e = complete(LESSONS[0].id);
  const cards = reviewCards(e);
  assert.equal(cards.length, 3);
  assert.equal(dueReviews(e, new Date('2026-01-01T02:00:00Z')).length, 0);
  assert.equal(dueReviews(e, new Date('2026-01-02T02:00:00Z')).length, 3);
  const failed = event({
    kind: 'review',
    wordId: cards[0].wordId,
    rating: 0,
    at: '2026-01-02T02:00:00Z',
    day: '2026-01-02',
  });
  const updated = reviewCards([...e, failed]).find(
    (c) => c.wordId === cards[0].wordId,
  )!;
  assert.equal(updated.lapses, 1);
  assert.equal(updated.due, '2026-01-02T02:10:00.000Z');
});
test('day boundary uses learner timezone and daily plan remains stable', () => {
  assert.equal(
    localDay(new Date('2026-01-01T16:01:00Z'), 'Asia/Ulaanbaatar'),
    '2026-01-02',
  );
  assert.equal(localDay(new Date('2026-01-01T16:01:00Z'), 'UTC'), '2026-01-01');
  const plan = event({ kind: 'plan', lessonId: LESSONS[0].id, reviews: [] });
  assert.equal(
    planForDay([...complete(LESSONS[0].id), plan], '2026-01-01')?.lessonId,
    LESSONS[0].id,
  );
});
test('forecast responds to real time and schedule without inventing JLPT scores', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  const slow = milestones([], DEFAULT_PREFERENCES, now);
  const fast = milestones([], { ...DEFAULT_PREFERENCES, minutes: 60 }, now);
  assert.ok(fast[0].earliest < slow[0].earliest);
  assert.equal(slow.length, 5);
  assert.ok(!('score' in slow[0]));
});
test('ordered geometry accepts a traced stroke and rejects reversed, short, or scribbled marks', () => {
  const target = Array.from({ length: 25 }, (_, i) => ({
    x: 20 + i * 2,
    y: 30 + i * 0.4,
  }));
  assert.equal(matchesStroke(target, target), true);
  assert.equal(matchesStroke([...target].reverse(), target), false);
  assert.equal(matchesStroke(target.slice(0, 5), target), false);
  assert.equal(
    matchesStroke(
      target.map((p, i) => ({ ...p, y: p.y + (i % 2 ? 30 : -30) })),
      target,
    ),
    false,
  );
});
test('dictionary includes all joyo and every joyo character has a Japanese stroke path', () => {
  const rows = JSON.parse(
    readFileSync(
      new URL('../../../public/dictionary/kanji.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(rows.length, 13108);
  const joyo = rows.filter((k: { joyo: boolean }) => k.joyo);
  assert.equal(joyo.length, 2136);
  for (const k of joyo)
    assert.ok((counts as Record<string, number>)[k.char], k.char);
});
