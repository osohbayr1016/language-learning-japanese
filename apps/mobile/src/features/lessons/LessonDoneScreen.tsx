import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { computeSkills } from './skills';
import { pickNextLessonInChapter } from './pickNextLessonInChapter';
import { LessonDoneMinimal } from './LessonDoneMinimal';
import { LessonDoneWithStats } from './LessonDoneWithStats';
import type { Exercise, ExerciseResult } from './types';
import type { JlptLevel, ImportedLessonContent } from '../../lib/types';

type Props = {
  exercises: Exercise[];
  results: ExerciseResult[];
  durationSec: number;
  xpEarned: number;
  accuracy: number;
  mastered: boolean | null;
  masteryRequired: number;
  finalizing: boolean;
  finalizeError: string | null;
  onRetryFinalize: () => void;
  onContinue: () => void;
  chapterId?: number;
  currentOrderNum?: number;
  importedContent?: ImportedLessonContent | null;
  chapterJlptLevel?: JlptLevel;
  /** false = админ урьдчилан харах (дараагийн хичээл, mock шалгалт нууна) */
  enablePostLessonNav?: boolean;
  /** Импорт/урьдчилан харах: XP, цаг, чадварын дугуйг харуулахгүй */
  minimalComplete?: boolean;
};

export function LessonDoneScreen({
  exercises,
  results,
  durationSec,
  xpEarned,
  accuracy,
  mastered,
  masteryRequired,
  finalizing,
  finalizeError,
  onRetryFinalize,
  onContinue,
  chapterId,
  currentOrderNum,
  importedContent,
  chapterJlptLevel,
  enablePostLessonNav = true,
  minimalComplete = false,
}: Props) {
  const { streak } = useGamification();
  const { token } = useAuth();
  const router = useRouter();
  const skills = computeSkills(exercises, results);
  const [nextLesson, setNextLesson] = useState<{ id: number; title_mn: string } | null>(null);

  useEffect(() => {
    if (!enablePostLessonNav || mastered !== true) {
      setNextLesson(null);
      return;
    }
    if (!token || chapterId == null || currentOrderNum == null) return;
    let cancelled = false;
    void api.lessons
      .list(token)
      .then((res) => {
        if (cancelled) return;
        const next = pickNextLessonInChapter(res.data, chapterId, currentOrderNum);
        setNextLesson(next ? { id: next.id, title_mn: next.title_mn } : null);
      })
      .catch(() => {
        if (!cancelled) setNextLesson(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, chapterId, currentOrderNum, enablePostLessonNav, mastered]);

  const goNext = () => {
    if (!nextLesson) return;
    router.replace(`/lessons/${nextLesson.id}` as never);
  };

  if (minimalComplete) {
    return (
      <LessonDoneMinimal
        enablePostLessonNav={enablePostLessonNav}
        nextLesson={nextLesson}
        goNext={goNext}
        onContinue={onContinue}
        importedContent={importedContent}
        chapterJlptLevel={chapterJlptLevel}
        mastered={mastered}
        masteryRequired={masteryRequired}
        finalizing={finalizing}
        finalizeError={finalizeError}
        onRetryFinalize={onRetryFinalize}
      />
    );
  }

  return (
    <LessonDoneWithStats
      durationSec={durationSec}
      xpEarned={xpEarned}
      accuracy={accuracy}
      mastered={mastered}
      masteryRequired={masteryRequired}
      finalizing={finalizing}
      finalizeError={finalizeError}
      onRetryFinalize={onRetryFinalize}
      skills={skills}
      streak={streak}
      enablePostLessonNav={enablePostLessonNav}
      token={token}
      importedContent={importedContent}
      chapterJlptLevel={chapterJlptLevel}
      nextLesson={nextLesson}
      goNext={goNext}
      onContinue={onContinue}
    />
  );
}
