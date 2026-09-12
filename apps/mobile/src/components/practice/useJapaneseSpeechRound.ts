import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { Word } from '../../lib/types';
import type { SpeechPromptScope } from '../../lib/audio/speechCardTargets';
import { speechRecognitionHints } from '../../lib/audio/speechCardTargets';
import { ensureSpeechPermission, useSpeechSession } from '../../lib/audio/speech';
import { scoreBestJapaneseUtterance, type SpeechTarget } from '../../lib/audio/speechScoring';
import {
  speakBreakdown,
  speakExampleAside,
  speakFinalLine,
  speakOutcomeBlock,
  speakPermissionDeniedLines,
} from './japaneseSpeechLabels';
import { useSpeakWordSessionReset } from './useSpeakWordSessionReset';

type Args = {
  word: Word;
  target: SpeechTarget;
  speechPrompt: SpeechPromptScope;
  hideMongolian: boolean;
  disabled?: boolean;
  onEvaluated: (p: boolean) => void;
  onScore?: (n: number) => void;
};

export function useJapaneseSpeechRound({
  word,
  target,
  speechPrompt,
  hideMongolian,
  disabled,
  onEvaluated,
  onScore,
}: Args) {
  const { state, result, liveTranscript, errorMessage, reset, supported, start, stop } =
    useSpeechSession();
  const activeMic = state === 'listening' || state === 'requesting';
  const [submitted, setSubmitted] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [passedRound, setPassedRound] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<string | null>(null);
  const [finalLine, setFinalLine] = useState<string | null>(null);
  const [celebrateStamp, setCelebrateStamp] = useState(0);
  const onEvalRef = useRef(onEvaluated);
  const onScoreRef = useRef(onScore);
  onEvalRef.current = onEvaluated;
  onScoreRef.current = onScore;
  // Keeps the scoring effect off the identity of a freshly built target object.
  const targetRef = useRef(target);
  targetRef.current = target;

  const resetRoundUi = useCallback(() => {
    setSubmitted(false);
    setPoints(null);
    setPassedRound(null);
    setTranscript(null);
    setBreakdown(null);
    setFinalLine(null);
    setCelebrateStamp(0);
  }, []);

  useSpeakWordSessionReset(word.id, stop, reset, resetRoundUi);

  useLayoutEffect(() => {
    if (!result || submitted) return;
    const ev = scoreBestJapaneseUtterance(
      [result.transcript, ...(result.alternatives ?? [])],
      targetRef.current
    );
    setPoints(ev.points);
    setTranscript(ev.matchedTranscript || result.transcript.trim());
    setFinalLine(speakFinalLine(ev.finalPercent, hideMongolian));
    setBreakdown(
      speakBreakdown(
        Math.round(ev.surfaceRatio * 100),
        Math.round(ev.readingRatio * 100),
        hideMongolian
      )
    );
    setPassedRound(ev.pass);
    setSubmitted(true);
    if (ev.pass) setCelebrateStamp((s) => s + 1);
    onEvalRef.current(ev.pass);
    onScoreRef.current?.(ev.finalPercent);
  }, [result, submitted, hideMongolian]);

  const onMicPress = async () => {
    if (submitted || disabled || state === 'processing') return;
    if (activeMic) {
      stop();
      return;
    }
    const granted = await ensureSpeechPermission();
    if (!granted) {
      const d = speakPermissionDeniedLines(hideMongolian);
      onEvalRef.current(false);
      onScoreRef.current?.(0);
      setSubmitted(true);
      setPoints(0);
      setPassedRound(false);
      setTranscript(null);
      setBreakdown(d.breakdown);
      setFinalLine(d.finalLine);
      return;
    }
    reset();
    setSubmitted(false);
    setPassedRound(null);
    setPoints(null);
    setTranscript(null);
    setBreakdown(null);
    setFinalLine(null);
    start(speechRecognitionHints(word, target.jp));
  };

  const outcome = speakOutcomeBlock({
    hideMongolian,
    submitted,
    points,
    transcript,
    finalLine,
    breakdown,
    passedRound,
  });

  const exampleAside =
    speechPrompt === 'word' && word.example_jp && word.example_jp !== word.kanji
      ? speakExampleAside(word.example_jp, hideMongolian)
      : null;

  const markFallbackAnswer = useCallback(
    (pass: boolean) => {
      setSubmitted(true);
      onEvaluated(pass);
    },
    [onEvaluated]
  );

  return {
    activeMic,
    submitted,
    points,
    processing: state === 'processing',
    liveTranscript,
    errorMessage,
    supported,
    celebrateStamp,
    outcome,
    exampleAside,
    onMicPress,
    markFallbackAnswer,
  };
}
