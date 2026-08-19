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
import { SentencePrompt } from './SentencePrompt';
import { CandidateTray } from './CandidateTray';
import { timingScore } from '../translate/scoring';
import type { Word } from '../../../lib/types';

const ROUNDS = 6;
const OPTIONS = 4;

type Props = {
  initialWords?: Word[];
  onDone?: (score: number, accuracy: number) => void;
};

export default function SentenceScreen({ initialWords, onDone }: Props) {
  const { words: randomPool, loading } = useRandomWords(ROUNDS + OPTIONS + 4);
  const pool = initialWords ?? randomPool;
  const { save } = useGameSession();
  const timer = useAdaptiveTimer();
  const { playWord } = useAudio();

  const queue = useMemo(
    () => pool.filter((w) => (w.example_jp ?? '').length > 0),
    [pool]
  );
  const distractorPool = useMemo(() => pool, [pool]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Word | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [start, setStart] = useState<number>(Date.now());
  const [done, setDone] = useState(false);

  const current = queue[idx];

  const candidates = useMemo(() => {
    if (!current) return [];
    const distractors = distractorPool.filter((w) => w.id !== current.id).slice(0, OPTIONS - 1);
    return [current, ...distractors].sort(() => Math.random() - 0.5);
  }, [current, distractorPool]);

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
          <GameHud title={mn.games.sentence} score={0} />
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
          setIdx(0); setSelected(null); setScore(0); setCorrectCount(0); setStart(Date.now()); setDone(false);
        }}
      />
    );
  }

  const handlePick = async (w: Word) => {
    if (selected) return;
    const ms = timer.stopAndReset() ?? 5000;
    const ok = w.id === current.id;
    setSelected(w);
    const delta = timingScore(ms, ok);
    setScore((s) => Math.max(0, s + delta));
    if (ok) {
      setCorrectCount((c) => c + 1);
      void playWord(current.id);
    }

    setTimeout(async () => {
      setSelected(null);
      if (idx + 1 >= queue.length) {
        const elapsed = Math.max(1, Math.round((Date.now() - start) / 1000));
        const finalScore = score + delta;
        const xp = Math.round(finalScore / 4);
        const acc = queue.length > 0 ? (correctCount + (ok ? 1 : 0)) / queue.length : 0;
        await save({
          game_type: 'sentence',
          score: Math.max(0, finalScore),
          accuracy: acc,
          duration_seconds: elapsed,
          words_practiced: queue.length,
          xp_earned: xp,
        });
        setDone(true);
        if (onDone) onDone(finalScore, acc);
      } else {
        setIdx((i) => i + 1);
      }
    }, 900);
  };

  const state: 'idle' | 'correct' | 'wrong' = selected
    ? selected.id === current.id ? 'correct' : 'wrong'
    : 'idle';

  return (
    <Screen scroll>
      <GameHud
        title={mn.games.sentence}
        score={score}
        progressLabel={`${idx + 1}/${queue.length}`}
      />
      <SentencePrompt word={current} filled={selected?.kanji ?? null} />
      <CandidateTray
        candidates={candidates}
        selectedId={selected?.id ?? null}
        state={state}
        onPick={handlePick}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
