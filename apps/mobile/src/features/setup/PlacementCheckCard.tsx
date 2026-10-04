import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '../../primitives';
import { colors, radius, spacing, typography } from '../../theme';
import {
  PLACEMENT_QUESTIONS,
  placementLabel,
  placementLevelFromScore,
  type PlacementLevel,
} from './placement';

type Props = {
  result: PlacementLevel | null;
  onComplete: (level: PlacementLevel) => void;
};

export function PlacementCheckCard({ result, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);

  const reset = () => {
    setStarted(true);
    setIndex(0);
    setSelected(null);
    setCorrect(0);
  };

  if (!started) {
    return (
      <Card padding="lg" style={styles.card}>
        <Text style={styles.title}>Түвшнээ богино шалгалтаар шалгах уу?</Text>
        <Text style={styles.body}>
          Сонголттой 8 асуулт. Албан ёсны JLPT дүн биш; зөвхөн хаанаас эхлэхийг санал болгоход ашиглана.
        </Text>
        {result ? (
          <Text style={styles.result}>Өмнөх дүн: {placementLabel(result)}</Text>
        ) : null}
        <Button
          label={result ? 'Дахин шалгах' : 'Түвшин тогтоох'}
          variant="secondary"
          onPress={reset}
          style={styles.button}
        />
      </Card>
    );
  }

  const q = PLACEMENT_QUESTIONS[index];

  const next = () => {
    if (selected == null) return;
    const nextCorrect = correct + (selected === q.correctIndex ? 1 : 0);
    if (index === PLACEMENT_QUESTIONS.length - 1) {
      onComplete(placementLevelFromScore(nextCorrect));
      setStarted(false);
      return;
    }
    setCorrect(nextCorrect);
    setIndex((v) => v + 1);
    setSelected(null);
  };

  return (
    <Card padding="lg" style={styles.card}>
      <Text style={styles.progress}>{index + 1}/{PLACEMENT_QUESTIONS.length}</Text>
      <Text style={styles.question}>{q.prompt}</Text>
      <View style={styles.options}>
        {q.options.map((option, optionIndex) => {
          const active = selected === optionIndex;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{ selected: active }}
              onPress={() => setSelected(optionIndex)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button
        label={index === PLACEMENT_QUESTIONS.length - 1 ? 'Дүн харах' : 'Дараах'}
        disabled={selected == null}
        onPress={next}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, marginBottom: spacing.md },
  title: { ...typography.heading.sm, color: colors.text.primary },
  body: { ...typography.body.sm, color: colors.text.secondary, marginTop: spacing.xs },
  result: { ...typography.body.md, color: colors.brand.primary, fontWeight: '800', marginTop: spacing.sm },
  progress: { ...typography.body.xs, color: colors.text.muted, fontWeight: '700' },
  question: { ...typography.heading.md, color: colors.text.primary, marginTop: spacing.sm },
  options: { gap: spacing.sm, marginTop: spacing.md },
  option: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.bg.card,
  },
  optionActive: { borderColor: colors.brand.primary, backgroundColor: colors.soft.brand },
  optionText: { ...typography.body.md, color: colors.text.primary },
  optionTextActive: { color: colors.brand.primary, fontWeight: '800' },
  button: { marginTop: spacing.md },
});
