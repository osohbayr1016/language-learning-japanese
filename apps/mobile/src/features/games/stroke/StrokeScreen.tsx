import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Screen } from '../../../primitives';
import { useGameSession } from '../../../hooks/useGameSession';
import { useAdaptiveTimer } from '../../../hooks/useAdaptiveTimer';
import { mn } from '../../../i18n/mn';
import { GameHud } from '../GameHud';
import { GameOverScreen } from '../GameOverScreen';
import { GameSaveRecovery } from '../GameSaveRecovery';
import { STROKE_PUZZLES, shufflePuzzles, type StrokePuzzle } from './puzzles';
import { PuzzleDisplay } from './PuzzleDisplay';
import { OptionTray } from './OptionTray';
import { timingScore } from '../translate/scoring';

export default function StrokeScreen() {
  const { save, retry } = useGameSession();
  const timer = useAdaptiveTimer();

  const [queue, setQueue] = useState<StrokePuzzle[]>(() => shufflePuzzles(STROKE_PUZZLES));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [start, setStart] = useState<number>(Date.now());
  const [done, setDone] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState(false);

  const current = queue[idx];

  useEffect(() => { if (current && !picked && !pendingCompletion && !done) timer.start(); }, [current, picked, pendingCompletion, done, timer]);

  if (done) {
    return (
      <GameOverScreen
        score={score}
        xp={Math.round(score / 4)}
        durationSeconds={Math.round((Date.now() - start) / 1000)}
        onPlayAgain={() => {
          setQueue(shufflePuzzles(STROKE_PUZZLES));
          setIdx(0); setPicked(null); setScore(0); setCorrectCount(0); setDone(false); setStart(Date.now()); setPendingCompletion(false);
        }}
      />
    );
  }

  if (pendingCompletion) return <GameSaveRecovery onRetry={async () => {
    if (await retry()) { setPendingCompletion(false); setDone(true); }
  }} />;

  const state: 'idle' | 'correct' | 'wrong' = picked
    ? picked === current.missingPart ? 'correct' : 'wrong'
    : 'idle';

  const handlePick = async (opt: string) => {
    if (picked) return;
    const ms = timer.stopAndReset() ?? 5000;
    const ok = opt === current.missingPart;
    setPicked(opt);
    const delta = timingScore(ms, ok);
    setScore((s) => Math.max(0, s + delta));
    if (ok) setCorrectCount((c) => c + 1);

    setTimeout(async () => {
      if (idx + 1 >= queue.length) {
        const elapsed = Math.max(1, Math.round((Date.now() - start) / 1000));
        const finalScore = Math.max(0, score + delta);
        const xp = Math.round(finalScore / 4);
        const saved = await save({
          game_type: 'stroke',
          score: finalScore,
          accuracy: queue.length > 0 ? (correctCount + (ok ? 1 : 0)) / queue.length : 0,
          duration_seconds: elapsed,
          words_practiced: queue.length,
          xp_earned: xp,
        });
        if (!saved) { setPendingCompletion(true); return; }
        setDone(true);
      } else {
        setPicked(null);
        setIdx((i) => i + 1);
      }
    }, 900);
  };

  return (
    <Screen scroll>
      <GameHud
        title={mn.games.stroke}
        score={score}
        progressLabel={`${idx + 1}/${queue.length}`}
      />
      <PuzzleDisplay puzzle={current} filled={picked && state === 'correct' ? picked : null} />
      <OptionTray
        options={current.options}
        selected={picked}
        state={state}
        correct={current.missingPart}
        onPick={handlePick}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({});
