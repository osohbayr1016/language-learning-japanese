import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Screen } from '../../primitives';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { colors, radius, spacing, typography } from '../../theme';

type Question = {
  glyph: string;
  answer: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  { glyph: 'あ', answer: 'a', options: ['a', 'i', 'u', 'e'] },
  { glyph: 'き', answer: 'ki', options: ['ka', 'ki', 'ku', 'ke'] },
  { glyph: 'し', answer: 'shi', options: ['sa', 'shi', 'su', 'se'] },
  { glyph: 'つ', answer: 'tsu', options: ['ta', 'chi', 'tsu', 'te'] },
  { glyph: 'ぬ', answer: 'nu', options: ['na', 'ni', 'nu', 'ne'] },
  { glyph: 'ん', answer: 'n', options: ['wa', 'wo', 'n', 'ra'] },
  { glyph: 'ア', answer: 'a', options: ['a', 'i', 'u', 'o'] },
  { glyph: 'シ', answer: 'shi', options: ['shi', 'tsu', 'chi', 'su'] },
  { glyph: 'ツ', answer: 'tsu', options: ['shi', 'tsu', 'to', 'te'] },
  { glyph: 'ネ', answer: 'ne', options: ['na', 'ni', 'nu', 'ne'] },
  { glyph: 'ホ', answer: 'ho', options: ['ha', 'hi', 'fu', 'ho'] },
  { glyph: 'ワ', answer: 'wa', options: ['ra', 'wa', 'wo', 'n'] },
];

const PASS_COUNT = 10;

export default function KanaCheckpointScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const questions = useMemo(() => QUESTIONS, []);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const question = questions[index];

  const reset = () => {
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setFinished(false);
    setPassed(false);
    setSaveError(null);
  };

  const advance = async () => {
    if (!selected || !question) return;
    const nextCorrect = correct + (selected === question.answer ? 1 : 0);

    if (index < questions.length - 1) {
      setCorrect(nextCorrect);
      setIndex((v) => v + 1);
      setSelected(null);
      return;
    }

    const didPass = nextCorrect >= PASS_COUNT;
    setCorrect(nextCorrect);
    setPassed(didPass);
    setFinished(true);

    if (didPass && token) {
      setSaving(true);
      setSaveError(null);
      try {
        await api.user.updatePreferences(token, { kana_foundation_completed: true });
      } catch {
        setSaveError('Дүнг серверт хадгалж чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.');
      } finally {
        setSaving(false);
      }
    }
  };

  if (finished) {
    return (
      <Screen scroll>
        <Card padding="lg" variant="elevated">
          <Text style={styles.eyebrow}>КАНА CHECKPOINT</Text>
          <Text style={styles.resultTitle}>
            {passed ? 'Суурь бэлэн байна' : 'Дахиад жаахан давтаарай'}
          </Text>
          <Text style={styles.resultScore}>{correct}/{questions.length}</Text>
          <Text style={styles.body}>
            {passed
              ? 'Хирагана, катаканагийн үндсэн танилт хангалттай байна. Одоо N5 хичээл рүү орж болно.'
              : `N5 рүү шилжихийн өмнө хамгийн багадаа ${PASS_COUNT}/${questions.length} зөв хариулаарай.`}
          </Text>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          {passed && !saveError ? (
            <Button
              label="N5 суралцах зам руу орох"
              loading={saving}
              disabled={saving}
              onPress={() => router.replace('/study' as never)}
              style={styles.button}
            />
          ) : (
            <>
              <Button label="Канагаа дахин харах" variant="secondary" onPress={() => router.replace('/kana' as never)} style={styles.button} />
              <Button label="Шалгалтыг дахин өгөх" onPress={reset} style={styles.button} />
            </>
          )}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>КАНА CHECKPOINT</Text>
        <Text style={styles.title}>Тэмдэглэгээг уншаарай</Text>
        <Text style={styles.body}>
          {index + 1}/{questions.length} · N5 зам руу орохын өмнөх богино шалгалт
        </Text>
      </View>

      <Card padding="lg" variant="elevated">
        <Text style={styles.glyph}>{question.glyph}</Text>
        <Text style={styles.prompt}>Энэ кана хэрхэн уншигдах вэ?</Text>

        <View style={styles.options}>
          {question.options.map((option) => {
            const active = selected === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelected(option)}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={index === questions.length - 1 ? 'Дүнгээ харах' : 'Дараах'}
          disabled={!selected}
          onPress={() => void advance()}
          style={styles.button}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  eyebrow: {
    ...typography.body.xs,
    color: colors.brand.primary,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: { ...typography.heading.lg, color: colors.text.primary, marginTop: spacing.xs },
  body: { ...typography.body.md, color: colors.text.secondary, marginTop: spacing.sm },
  glyph: {
    fontSize: 84,
    lineHeight: 104,
    textAlign: 'center',
    color: colors.text.primary,
    fontWeight: '700',
    marginVertical: spacing.lg,
  },
  prompt: { ...typography.heading.sm, color: colors.text.primary, textAlign: 'center' },
  options: { gap: spacing.sm, marginTop: spacing.lg },
  option: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.card,
  },
  optionActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.soft.brand,
  },
  optionText: { ...typography.heading.sm, color: colors.text.primary },
  optionTextActive: { color: colors.brand.primary },
  button: { marginTop: spacing.md },
  resultTitle: { ...typography.heading.lg, color: colors.text.primary, marginTop: spacing.sm },
  resultScore: {
    fontSize: 48,
    lineHeight: 58,
    fontWeight: '800',
    color: colors.brand.primary,
    marginTop: spacing.lg,
  },
  error: { ...typography.body.sm, color: colors.error, marginTop: spacing.md },
});
