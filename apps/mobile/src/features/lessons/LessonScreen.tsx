import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '../../lib/navigation/safeBack';
import { Screen } from '../../primitives';
import { colors, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { useAuth } from '../../context/AuthContext';
import { useLessonSession } from './useLessonSession';
import { LessonHeader } from './LessonHeader';
import { LoadingScreen } from './LoadingScreen';
import { ExerciseCard } from './ExerciseCard';
import { FeedbackBanner } from './FeedbackBanner';
import { MoreMenu } from './MoreMenu';
import { LeaveSheet } from './LeaveSheet';
import { LessonDoneScreen } from './LessonDoneScreen';
import {
  ExerciseRenderer,
  exerciseCorrectAnswer,
  exercisePromptFor,
} from './exercises';
import { exerciseDisplayTitle, isImportedLearnFlow } from './types';
import { InLessonGamesHub } from './games/InLessonGamesHub';
import SentenceScreen from '../games/sentence/SentenceScreen';
import MatchScreen from '../games/match/MatchScreen';
import TranslateScreen from '../games/translate/TranslateScreen';
import type { Word } from '../../lib/types';

export type LessonScreenVariant = 'learn' | 'adminPreview';

type Props = { lessonId: number; variant?: LessonScreenVariant };

export function LessonScreen({ lessonId, variant = 'learn' }: Props) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const isPreview = variant === 'adminPreview';
  const { state, current, submit, advance, submitImportedStep, forceLessonComplete, finalize, accuracy } = useLessonSession(
    lessonId,
    {
      mode: isPreview ? 'adminPreview' : 'default',
    }
  );
  const [banner, setBanner] = useState<{ correct: boolean } | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [gamePhase, setGamePhase] = useState<'sentence' | 'match' | 'translate' | null>(null);

  const exitLesson = () => {
    if (isPreview) {
      safeBack(router, '/admin/learning-path');
      return;
    }
    router.replace('/(tabs)/home');
  };

  const gameWords = React.useMemo(() => {
    if (!state.detail) return undefined;
    if (state.detail.words && state.detail.words.length > 0) return state.detail.words as Word[];
    if (state.detail.imported_content?.vocab) {
      const vocab = state.detail.imported_content.vocab;
      return vocab.map((v, i) => {
        let example = null;
        for (const d of state.detail!.imported_content!.dialogues || []) {
          for (const line of d.lines || []) {
            if (line.jp.includes(v.kanji) && line.jp.length > v.kanji.length) {
              example = line.jp;
              break;
            }
          }
          if (example) break;
        }
        return {
          id: -i - 1,
          kanji: v.kanji,
          romaji: v.romaji,
          romaji_numbered: null,
          kana: null,
          meaning_mn: v.meaning_mn,
          meaning_en: null,
          jlpt_level: v.jlpt_level as any,
          part_of_speech: null,
          example_jp: example,
          example_romaji: null,
          example_mn: null,
          audio_url: null,
          stroke_count: null,
        } as Word;
      });
    }
    return undefined;
  }, [state.detail]);

  useEffect(() => {
    if (state.status === 'done') void finalize();
  }, [state.status, finalize]);

  const onAnswer = (correct: boolean) => {
    if (current?.kind === 'imported-section') {
      submitImportedStep(correct);
      return;
    }
    submit(correct);
    setBanner({ correct });
  };

  const onContinue = () => {
    setBanner(null);
    advance();
  };

  const onLeave = () => {
    setLeaveOpen(false);
    setMoreOpen(false);
    exitLesson();
  };

  if (state.status === 'loading') {
    return (
      <Screen edges={['top', 'bottom']}>
        <LoadingScreen />
      </Screen>
    );
  }

  if (state.status === 'error') {
    return (
      <Screen edges={['top', 'bottom']} padded={false}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{state.error ?? mn.common.error}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mn.common.back}
            style={styles.errorBtn}
            onPress={exitLesson}
          >
            <Text style={styles.errorBtnLabel}>{mn.common.back}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (state.status === 'done') {
    return (
      <LessonDoneScreen
        exercises={state.exercises}
        results={state.results}
        durationSec={state.durationSec}
        xpEarned={state.xpEarned}
        accuracy={accuracy}
        mastered={state.mastered}
        masteryRequired={state.masteryRequired}
        finalizing={state.finalizing}
        finalizeError={state.finalizeError}
        onRetryFinalize={() => void finalize()}
        chapterId={state.detail?.chapter_id}
        currentOrderNum={state.detail?.order_num}
        importedContent={state.detail?.imported_content}
        chapterJlptLevel={state.detail?.chapter_jlpt_level}
        enablePostLessonNav={!isPreview}
        minimalComplete={isImportedLearnFlow(state.exercises) || isPreview}
        onContinue={exitLesson}
      />
    );
  }

  const total = state.exercises.length;
  const progress = total > 0 ? (state.index + (banner ? 1 : 0)) / total : 0;

  if (current?.kind === 'in-lesson-games-hub') {
    if (gamePhase === 'sentence') {
      return <SentenceScreen initialWords={gameWords} onDone={() => setGamePhase('match')} />;
    }
    if (gamePhase === 'match') {
      return <MatchScreen initialWords={gameWords} onDone={() => setGamePhase('translate')} />;
    }
    if (gamePhase === 'translate') {
      return <TranslateScreen initialWords={gameWords} onDone={() => forceLessonComplete(1.0)} />;
    }
    return (
      <InLessonGamesHub
        onContinue={() => setGamePhase('sentence')}
        onDone={() => forceLessonComplete(1.0)}
      />
    );
  }

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <View style={styles.headerWrap}>
        <LessonHeader
          progress={progress}
          onClose={() => setLeaveOpen(true)}
          onMore={() => setMoreOpen(true)}
          onAdminEdit={
            isAdmin && !isPreview ? () => router.push(`/admin/lesson/${lessonId}` as never) : undefined
          }
        />
      </View>

      <View style={styles.body}>
        {current ? (
          <ExerciseCard
            title={exerciseDisplayTitle(current)}
            prompt={exercisePromptFor(current)}
          >
            <ExerciseRenderer
              key={current.id}
              exercise={current}
              lessonWords={state.detail?.words}
              disabled={!!banner}
              onAnswer={onAnswer}
            />
          </ExerciseCard>
        ) : null}
      </View>

      <FeedbackBanner
        visible={!!banner}
        correct={banner?.correct ?? false}
        correctAnswer={current ? exerciseCorrectAnswer(current) : undefined}
        onContinue={onContinue}
      />

      <MoreMenu
        visible={moreOpen}
        onDismiss={() => setMoreOpen(false)}
        onFeedback={() => setMoreOpen(false)}
        onLeave={() => {
          setMoreOpen(false);
          setLeaveOpen(true);
        }}
      />

      <LeaveSheet
        visible={leaveOpen}
        onCancel={() => setLeaveOpen(false)}
        onLeave={onLeave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: spacing.lg, backgroundColor: colors.bg.primary },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  errorText: { ...typography.body.md, color: colors.text.secondary, textAlign: 'center' },
  errorBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
  },
  errorBtnLabel: { ...typography.body.md, fontWeight: '700' as const, color: '#fff' },
});
