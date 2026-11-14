import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Screen } from '../../../primitives';
import { useRandomWords } from '../../../hooks/useRandomWords';
import { useGameSession } from '../../../hooks/useGameSession';
import { useAdaptiveTimer } from '../../../hooks/useAdaptiveTimer';
import { useAudio } from '../../../context/AudioContext';
import { colors, spacing } from '../../../theme';
import { mn } from '../../../i18n/mn';
import { GameHud } from '../GameHud';
import { GameOverScreen } from '../GameOverScreen';
import { GameSaveRecovery } from '../GameSaveRecovery';
import { AnswerOption } from '../../study/learn/AnswerOption';
import { pickDistractors, shuffle } from '../../study/learn/distractors';
import { TranslateQuestion } from './TranslateQuestion';
import { timingScore } from './scoring';
import type { Word } from '../../../lib/types';

const ROUNDS = 8;
const OPTIONS = 4;

type Props = {
  initialWords?: Word[];
  onDone?: (score: number, accuracy: number) => void;
};

export default function TranslateScreen({ initialWords, onDone }: Props) {
  const { words: randomPool, loading } = useRandomWords(ROUNDS + OPTIONS + 4);
  const words = initialWords ?? randomPool;
  const { save, retry } = useGameSession();
  const timer = useAdaptiveTimer();
  const { playWord } = useAudio();

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<Word | null>(null);
  const [start, setStart] = useState<number>(Date.now());
  const [done, setDone] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<{score: number; accuracy: number} | null>(null);

  const queue = useMemo(() => words, [words]);
  const current = queue[idx];
  const direction = idx % 2 === 0 ? 'jp-to-mn' : 'mn-to-jp';

  const options = useMemo(() => {
    if (!current) return [] as Word[];
    const wordsAsProgress = words.map((w) => ({ ...w, ease_factor: null, interval: null, repetitions: null, next_review: null, last_reviewed: null }));
    const cur = wordsAsProgress.find((w) => w.id === current.id)!;
    const ds = pickDistractors(wordsAsProgress, cur, OPTIONS - 1, 'medium');
    return shuffle([cur, ...ds]) as Word[];
  }, [current, words]);

  useEffect(() => { if (current) timer.start(); }, [current, timer]);

  useEffect(() => {
    if (!loading && queue.length === 0 && onDone && !done) {
      onDone(0, 0);
    }
  }, [loading, queue.length, onDone, done]);

  if (!initialWords && loading) {
    return <Screen><View style={styles.center}><ActivityIndicator color={colors.accent.purple} /></View></Screen>;
  }

  if (queue.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <GameHud title={mn.games.translate} score={0} />
        </View>
      </Screen>
    );
  }

  if (done) {
    if (onDone) {
      return null;
    }
    return (
      <GameOverScreen
        score={score}
        xp={Math.round(score / 4)}
        durationSeconds={Math.round((Date.now() - start) / 1000)}
        onPlayAgain={() => {
          setIdx(0); setScore(0); setCorrectCount(0); setPicked(null); setStart(Date.now()); setDone(false); setPendingCompletion(null);
        }}
      />
    );
  }

  if (pendingCompletion) return <GameSaveRecovery onRetry={async () => {
    if (await retry()) {
      setPendingCompletion(null);
      setDone(true);
      onDone?.(pendingCompletion.score, pendingCompletion.accuracy);
    }
  }} />;

  const handlePick = async (chosen: Word) => {
    if (!current || picked) return;
    const ms = timer.stopAndReset() ?? 5000;
    const ok = chosen.id === current.id;
    setPicked(chosen);
    setScore((s) => Math.max(0, s + timingScore(ms, ok)));
    if (ok) {
      setCorrectCount((c) => c + 1);
      void playWord(current.id);
    }
    setTimeout(async () => {
      if (idx + 1 >= queue.length) {
        const elapsed = Math.max(1, Math.round((Date.now() - start) / 1000));
        const finalScore = Math.max(0, score + timingScore(ms, ok));
        const xp = Math.round(finalScore / 4);
        const acc = queue.length > 0 ? (correctCount + (ok ? 1 : 0)) / queue.length : 0;
        const saved = await save({
          game_type: 'translate',
          score: finalScore,
          accuracy: acc,
          duration_seconds: elapsed,
          words_practiced: queue.length,
          xp_earned: xp,
        });
        if (!saved) {
          setPendingCompletion({ score: finalScore, accuracy: acc });
          return;
        }
        setDone(true);
        if (onDone) onDone(finalScore, acc);
      } else {
        setPicked(null);
        setIdx((i) => i + 1);
      }
    }, 800);
  };

  return (
    <Screen scroll>
      <GameHud
        title={mn.games.translate}
        score={score}
        progressLabel={`${idx + 1}/${queue.length}`}
      />
      <TranslateQuestion word={current!} direction={direction} />
      {options.map((o) => {
        let state: 'idle' | 'correct' | 'wrong' | 'reveal' = 'idle';
        if (picked) {
          if (o.id === current!.id) state = 'correct';
          else if (o.id === picked.id) state = 'wrong';
        }
        return (
          <AnswerOption
            key={o.id}
            word={{ ...o, ease_factor: null, interval: null, repetitions: null, next_review: null, last_reviewed: null }}
            show={direction === 'jp-to-mn' ? 'mn' : 'jp'}
            state={state}
            onPress={() => handlePick(o)}
          />
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
