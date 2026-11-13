import test from 'node:test';
import assert from 'node:assert/strict';
import { sectionalScores } from '../src/lib/examScoring';
function qs(sections: string[]) {
  return sections.flatMap((section, j) =>
    Array.from({ length: 10 }, (_, i) => ({ id: j * 10 + i, section })),
  );
}
test('N5 practice has 120 knowledge/reading and 60 listening, total 180', () => {
  const q = qs(['reading', 'listening']);
  const score = sectionalScores(q, new Map(q.map((q) => [q.id, true])), 1);
  assert.equal(score.reading, 120);
  assert.equal(score.listening, 60);
  assert.equal(score.total, 180);
  assert.equal(score.passed, true);
});
test('a weak N5 listening section fails even with a high total', () => {
  const q = qs(['reading', 'listening']);
  const score = sectionalScores(
    q,
    new Map(q.map((q) => [q.id, q.section === 'reading' || q.id < 13])),
    1,
  );
  assert.equal(score.total, 138);
  assert.equal(score.passed, false);
});
test('N3–N1 require all three sections, each at least 19', () => {
  const q = qs(['knowledge', 'reading', 'listening']);
  for (const band of [3, 4, 5]) {
    const score = sectionalScores(
      q,
      new Map(q.map((q) => [q.id, q.section !== 'knowledge' || q.id < 3])),
      band,
    );
    assert.equal(score.knowledge, 18);
    assert.equal(score.passed, false);
    assert.equal(
      sectionalScores(q, new Map(q.map((q) => [q.id, true])), band).total,
      180,
    );
  }
});
test('missing sections never produce a pass', () => {
  const q = qs(['reading']);
  assert.equal(
    sectionalScores(q, new Map(q.map((q) => [q.id, true])), 1).passed,
    false,
  );
});
