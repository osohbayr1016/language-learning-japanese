import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import type { LessonDetail } from '../../lib/types';
import type { Exercise, ExerciseResult, LessonStatus } from './types';
import { buildExercises } from './buildExercises';
import { fetchLessonSessionDetail } from './fetchLessonSessionDetail';
import { submitLessonCompleteToServer } from './submitLessonCompleteToServer';

const XP_PER_CORRECT = 10;

export type LessonSessionMode = 'default' | 'adminPreview';

export type LessonState = {
  status: LessonStatus;
  detail: LessonDetail | null;
  exercises: Exercise[];
  index: number;
  results: ExerciseResult[];
  xpEarned: number;
  durationSec: number;
  error: string | null;
  accuracyOverride: number | null;
  mastered: boolean | null;
  masteryRequired: number;
  finalizing: boolean;
  finalizeError: string | null;
};

export function useLessonSession(lessonId: number, opts: { mode?: LessonSessionMode } = {}) {
  const mode = opts.mode ?? 'default';
  const adminPreview = mode === 'adminPreview';
  const { token } = useAuth();
  const { addLocalXp, refresh: refreshGam } = useGamification();
  const [state, setState] = useState<LessonState>({
    status: 'loading',
    detail: null,
    exercises: [],
    index: 0,
    results: [],
    xpEarned: 0,
    durationSec: 0,
    error: null,
    accuracyOverride: null,
    mastered: null,
    masteryRequired: 0.8,
    finalizing: false,
    finalizeError: null,
  });
  const startedAt = useRef(Date.now());
  const exerciseStartAt = useRef(Date.now());
  const completionIdRef = useRef('');
  const finalizeInFlightRef = useRef(false);
  const finalizedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setState({
      status: 'loading',
      detail: null,
      exercises: [],
      index: 0,
      results: [],
      xpEarned: 0,
      durationSec: 0,
      error: null,
      accuracyOverride: null,
      mastered: null,
      masteryRequired: 0.8,
      finalizing: false,
      finalizeError: null,
    });
    completionIdRef.current = `lesson-${lessonId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    finalizeInFlightRef.current = false;
    finalizedRef.current = false;
    void (async () => {
      try {
        const res = await fetchLessonSessionDetail({ lessonId, token, adminPreview });
        const exercises = buildExercises(res.data.words, res.data.imported_content);
        if (cancelled) return;
        startedAt.current = Date.now();
        exerciseStartAt.current = Date.now();
        setState((s) => ({
          ...s,
          status: 'running',
          detail: res.data,
          exercises,
          error: null,
        }));
      } catch (e) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          status: 'error',
          error: e instanceof Error ? e.message : 'Алдаа гарлаа',
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId, token, adminPreview]);

  const current = state.exercises[state.index];

  const submit = useCallback((correct: boolean) => {
    setState((s) => {
      const ex = s.exercises[s.index];
      if (!ex) return s;
      const wordIds =
        ex.kind === 'match-pairs' ? ex.pairs.map((w) => w.id)
          : 'word' in ex ? [ex.word.id]
            : [];
      const responseMs = Date.now() - exerciseStartAt.current;
      const result: ExerciseResult = { exerciseId: ex.id, wordIds, correct, responseMs };
      const xpDelta = correct ? XP_PER_CORRECT : 0;
      return {
        ...s,
        results: [...s.results, result],
        xpEarned: s.xpEarned + xpDelta,
      };
    });
  }, []);

  const advance = useCallback(() => {
    setState((s) => {
      const next = s.index + 1;
      if (next >= s.exercises.length) {
        return { ...s, status: 'done', durationSec: Math.round((Date.now() - startedAt.current) / 1000) };
      }
      exerciseStartAt.current = Date.now();
      return { ...s, index: next };
    });
  }, []);

  /** Нэг алхамд үр дүн + дараагийн алхам (уншлага; FeedbackBanner үгүй). */
  const submitImportedStep = useCallback((correct: boolean) => {
    setState((s) => {
      const ex = s.exercises[s.index];
      if (!ex) return s;
      const wordIds =
        ex.kind === 'match-pairs'
          ? ex.pairs.map((w) => w.id)
          : 'word' in ex
            ? [ex.word.id]
            : [];
      const responseMs = Date.now() - exerciseStartAt.current;
      const result: ExerciseResult = { exerciseId: ex.id, wordIds, correct, responseMs };
      const xpDelta = correct ? XP_PER_CORRECT : 0;
      const next = s.index + 1;
      if (next >= s.exercises.length) {
        return {
          ...s,
          results: [...s.results, result],
          xpEarned: s.xpEarned + xpDelta,
          status: 'done' as LessonStatus,
          durationSec: Math.round((Date.now() - startedAt.current) / 1000),
        };
      }
      exerciseStartAt.current = Date.now();
      return {
        ...s,
        results: [...s.results, result],
        xpEarned: s.xpEarned + xpDelta,
        index: next,
      };
    });
  }, []);

  const forceLessonComplete = useCallback((overrideAccuracy: number) => {
    setState((s) => ({
      ...s,
      accuracyOverride: overrideAccuracy,
      status: 'done',
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
    }));
  }, []);

  const finalize = useCallback(async () => {
    if (adminPreview || !token || state.status !== 'done') return;
    if (finalizeInFlightRef.current || finalizedRef.current) return;
    finalizeInFlightRef.current = true;
    setState((s) => ({ ...s, finalizing: true, finalizeError: null }));
    try {
      const result = await submitLessonCompleteToServer({
        token,
        lessonId,
        completionId: completionIdRef.current,
        exercises: state.exercises,
        results: state.results,
        detail: state.detail,
        xpEarned: state.xpEarned,
        durationSec: state.durationSec,
        addLocalXp,
        refreshGam,
      });
      finalizedRef.current = true;
      setState((s) => ({
        ...s,
        xpEarned: result.xp_earned,
        mastered: result.mastered,
        masteryRequired: result.mastery_required,
        finalizing: false,
        finalizeError: null,
      }));
    } catch (e) {
      setState((s) => ({
        ...s,
        finalizing: false,
        finalizeError: e instanceof Error ? e.message : 'Хичээлийн дүнг хадгалж чадсангүй',
      }));
    } finally {
      finalizeInFlightRef.current = false;
    }
  }, [
    adminPreview,
    token,
    lessonId,
    state.status,
    state.exercises,
    state.results,
    state.detail,
    state.xpEarned,
    state.durationSec,
    addLocalXp,
    refreshGam,
  ]);

  const accuracy = useMemo(() => {
    if (state.accuracyOverride !== null) return state.accuracyOverride;
    if (state.results.length === 0) return 0;
    return state.results.filter((r) => r.correct).length / state.results.length;
  }, [state.results, state.accuracyOverride]);

  return { state, current, submit, advance, submitImportedStep, forceLessonComplete, finalize, accuracy };
}
