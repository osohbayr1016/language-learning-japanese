import { api } from '../../lib/api';
import { calculateAdaptive } from '../../lib/srs/adaptive';
import type { LessonDetail, WordWithProgress } from '../../lib/types';
import type { ProgressResult } from '../../lib/api/user';
import { type Exercise, type ExerciseResult, isImportedLearnFlow } from './types';
import { computeSkillCounts } from './skills';

export async function submitLessonCompleteToServer(opts: {
  token: string;
  lessonId: number;
  exercises: Exercise[];
  results: ExerciseResult[];
  detail: LessonDetail | null;
  completionId: string;
  xpEarned: number;
  durationSec: number;
  addLocalXp: (n: number) => void;
  refreshGam: () => void;
}): Promise<{
  xp_earned: number;
  mastered: boolean;
  mastery_required: number;
  already_applied: boolean;
}> {
  const {
    token,
    lessonId,
    exercises,
    results,
    detail,
    completionId,
    xpEarned,
    durationSec,
    addLocalXp,
    refreshGam,
  } = opts;

  const totalCount = results.length;
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  const wordsById = new Map<number, WordWithProgress>();
  for (const w of detail?.words ?? []) wordsById.set(w.id, w);

  const progressByWord = new Map<number, { correct: boolean; responseMs: number }>();
  for (const r of results) {
    for (const wid of r.wordIds) {
      const existing = progressByWord.get(wid);
      if (!existing || (r.correct && !existing.correct)) {
        progressByWord.set(wid, { correct: r.correct, responseMs: r.responseMs });
      }
    }
  }

  const progressPayload: ProgressResult[] = [];
  for (const [wid, info] of progressByWord.entries()) {
    const w = wordsById.get(wid);
    if (!w) continue;
    const r = calculateAdaptive(
      { ease_factor: w.ease_factor, interval: w.interval, repetitions: w.repetitions },
      { rating: info.correct ? 4 : 1, responseMs: info.responseMs, confidence: 1 }
    );
    progressPayload.push({
      word_id: wid,
      ease_factor: r.ease_factor,
      interval: r.interval,
      repetitions: r.repetitions,
      next_review: r.next_review.toISOString(),
      response_ms: r.response_ms,
      confidence: r.confidence,
    });
  }

  const learnThroughDone =
    isImportedLearnFlow(exercises) &&
    Boolean(detail?.imported_content) &&
    results.length > 0 &&
    results.every((r) => r.correct) &&
    progressPayload.length === 0 &&
    (detail?.words?.length ?? 0) > 0;

  if (learnThroughDone && detail?.words) {
    for (const w of detail.words) {
      const r = calculateAdaptive(
        { ease_factor: w.ease_factor, interval: w.interval, repetitions: w.repetitions },
        { rating: 3, responseMs: 400, confidence: 1 }
      );
      progressPayload.push({
        word_id: w.id,
        ease_factor: r.ease_factor,
        interval: r.interval,
        repetitions: r.repetitions,
        next_review: r.next_review.toISOString(),
        response_ms: r.response_ms,
        confidence: r.confidence,
      });
    }
  }

  const skill_results = computeSkillCounts(exercises, results);

  const response = await api.lessons.complete(token, lessonId, {
    completion_id: completionId,
    accuracy,
    xp_earned: xpEarned,
    duration_seconds: durationSec,
    results: progressPayload,
    skill_results,
  });
  if (!response.data.already_applied) addLocalXp(response.data.xp_earned);
  void refreshGam();
  return response.data;
}
