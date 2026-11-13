import { JLPT, jlptName } from '../../../../packages/curriculum/src/jlpt';
/** Practice proportions in official section ranges, NOT official IRT scaled scores. */
export function sectionalScores<Q extends { id: number; section: string }>(
  questions: Q[],
  correctnessById: Map<number, boolean>,
  band = 1,
) {
  const rule = JLPT[jlptName(band)];
  const count = (section: string) => {
    const qs = questions.filter((q) => q.section === section);
    return {
      total: qs.length,
      correct: qs.filter((q) => correctnessById.get(q.id)).length,
    };
  };
  const l = count('listening'),
    r = count('reading'),
    k = count('knowledge');
  const advanced = band >= 3;
  const listening = l.total ? Math.round((l.correct / l.total) * 60) : 0;
  const knowledge = advanced
    ? k.total
      ? Math.round((k.correct / k.total) * 60)
      : 0
    : 0;
  const readTotal = advanced ? r.total : r.total + k.total,
    readCorrect = advanced ? r.correct : r.correct + k.correct;
  const reading = readTotal
    ? Math.round((readCorrect / readTotal) * (advanced ? 60 : 120))
    : 0;
  const total = listening + reading + knowledge;
  const sectionsPassed =
    l.total > 0 &&
    readTotal > 0 &&
    listening >= 19 &&
    reading >= (advanced ? 19 : 38) &&
    (!advanced || (k.total > 0 && knowledge >= 19));
  return {
    listening,
    reading,
    knowledge,
    total,
    passed: sectionsPassed && total >= rule.pass,
    listening_correct: l.correct,
    listening_total: l.total,
    reading_correct: readCorrect,
    reading_total: readTotal,
    knowledge_correct: k.correct,
    knowledge_total: k.total,
  };
}
export function examAnswerOk(
  type: string,
  userRaw: unknown,
  correct: string,
): boolean {
  const u = String(userRaw ?? '').trim(),
    c = String(correct ?? '').trim();
  if (type === 'word_picture')
    return (
      ['true', 'false'].includes(u.toLowerCase()) &&
      u.toLowerCase() === c.toLowerCase()
    );
  return type === 'picture_match'
    ? u.toLowerCase() === c.toLowerCase()
    : u === c;
}
