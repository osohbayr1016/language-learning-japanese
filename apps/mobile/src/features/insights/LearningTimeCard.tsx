import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import type { DayMinutes } from '../../lib/types';
import { SectionCard } from './SectionCard';
import { WeekBarChart } from './WeekBarChart';
import { RangeTabs } from './RangeTabs';
import { addDays } from './dates';

type Props = {
  weekStart: Date;
  data: DayMinutes[];
  onPrev: () => void;
  onNext: () => void;
};

function fmt(d: Date): string {
  const m = mn.insights.history.months[d.getMonth()].replace('-р сар', '');
  return `${m}/${d.getDate()}`;
}

export function LearningTimeCard({ weekStart, data, onPrev, onNext }: Props) {
  const weekEnd = addDays(weekStart, 6);
  const label = mn.insights.time.weekFmt
    .replace('{from}', fmt(weekStart))
    .replace('{to}', fmt(weekEnd));

  return (
    <SectionCard
      stackRight
      title={mn.insights.time.title}
      right={<RangeTabs active="weekly" enabled={['weekly']} />}
    >
      <View style={styles.head}>
        <Pressable onPress={onPrev} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
          <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
        </Pressable>
        <Text style={styles.range}>{label}</Text>
        <Pressable onPress={onNext} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </Pressable>
      </View>
      <WeekBarChart weekStart={weekStart} data={data} />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    paddingVertical: 8,
  },
  range: { ...typography.heading.sm, color: colors.text.primary },
  pressed: { opacity: 0.6 },
});
