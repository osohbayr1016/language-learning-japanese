import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ExamTemplate } from '../../lib/api/exams';
import { mn } from '../../i18n/mn';
import { mockExamStyles as styles } from './mockExamStyles';
import { colors } from '../../theme';
import { jlptNLabel } from '../../lib/jlptLabel';

type Props = {
  templates: ExamTemplate[];
  onPick: (templateId: number) => void;
  onBack?: () => void;
};

export function MockExamTemplatePicker({ templates, onPick, onBack }: Props) {
  const byLevel = new Map<number, typeof templates>();
  for (const t of templates) {
    const ls = byLevel.get(t.jlpt_level) ?? [];
    ls.push(t);
    byLevel.set(t.jlpt_level, ls);
  }
  const sections = [...byLevel.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <View style={styles.pickerWrap}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mn.common.back}
          style={styles.pickerBack}
          onPress={onBack}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={colors.brand.primary} />
          <Text style={styles.pickerBackTx}>{mn.common.back}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.h1}>{mn.study.mockExamPickTitle}</Text>
      <Text style={styles.p}>{mn.study.mockExamPickHint}</Text>
      {sections.map(([lvl, rows]) => (
        <View key={lvl} style={{ width: '100%' }}>
          <Text style={[styles.tplMeta, { marginTop: 12, marginBottom: 8, fontWeight: '600' }]}>{jlptNLabel(lvl)}</Text>
          {[...rows]
            .sort((a, b) => a.id - b.id)
            .map((t) => (
              <Pressable key={t.id} style={styles.tplRow} onPress={() => onPick(t.id)}>
                <Text style={styles.tplTitle}>{t.title}</Text>
                <Text style={styles.tplMeta}>
                  {t.total_questions} асуултаар · {t.duration_minutes} мин
                </Text>
              </Pressable>
            ))}
        </View>
      ))}
    </View>
  );
}
