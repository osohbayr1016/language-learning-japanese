import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '../../../lib/navigation/safeBack';
import { Button, Screen } from '../../../primitives';
import { JapaneseSpeechCard } from '../../../components/practice/JapaneseSpeechCard';
import { useRandomWords } from '../../../hooks/useRandomWords';
import { StudyHeader } from '../StudyHeader';
import { colors, spacing } from '../../../theme';

const SPEAK_TITLE = 'Speak';
const SPEAK_DESC = 'Use the mic to say the target phrase in Japanese (web and device).';
const SPEAK_SESSION_AVG = 'Session average ({count} items): {avg}/100';

export default function SpeakPracticeScreen() {
  const router = useRouter();
  const { words, loading, error } = useRandomWords(40);
  const pool = useMemo(
    () => words.filter((w) => (w.example_jp ?? w.kanji ?? '').length > 0),
    [words]
  );
  const [idx, setIdx] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [sessionSum, setSessionSum] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const current = pool[idx] ?? null;
  const sessionAvg = sessionCount > 0 ? Math.round(sessionSum / sessionCount) : null;
  const sessionAvgLabel =
    sessionAvg !== null
      ? SPEAK_SESSION_AVG.replace('{count}', String(sessionCount)).replace('{avg}', String(sessionAvg))
      : null;

  const next = () => {
    if (idx + 1 >= pool.length) {
      setIdx(0);
    } else {
      setIdx((i) => i + 1);
    }
    setRoundDone(false);
  };

  if (loading) {
    return (
      <Screen scroll>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !current) {
    return (
      <Screen scroll>
        <StudyHeader title={SPEAK_TITLE} index={0} total={1} />
        <Text style={styles.err}>{error ?? 'Could not load words.'}</Text>
        <Button label="Back" onPress={() => safeBack(router, '/(tabs)/study')} />
      </Screen>
    );
  }

  return (
    <Screen scroll scrollBottomInset={24}>
      <StudyHeader title={SPEAK_TITLE} index={idx} total={pool.length} />
      <Text style={styles.sub}>{SPEAK_DESC}</Text>
      {sessionAvgLabel ? <Text style={styles.sessionAvg}>{sessionAvgLabel}</Text> : null}
      <JapaneseSpeechCard
        key={`speak-${idx}-${current.id}`}
        word={current}
        hideMongolian
        onEvaluated={() => setRoundDone(true)}
        onScore={(n) => {
          setSessionSum((s) => s + n);
          setSessionCount((c) => c + 1);
        }}
      />
      {roundDone ? (
        <View style={styles.footer}>
          <Button label="Next" onPress={next} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center' },
  sub: {
    color: colors.text.secondary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sessionAvg: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  err: { color: colors.error, marginVertical: spacing.md },
  footer: { marginTop: spacing.lg },
});
