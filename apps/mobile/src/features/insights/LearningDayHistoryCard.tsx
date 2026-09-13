import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import type { DayMinutes } from '../../lib/types';
import { SectionCard } from './SectionCard';
import { MonthCalendar } from './MonthCalendar';
import { RangeTabs } from './RangeTabs';

type Props = {
  monthStart: Date;
  days: DayMinutes[];
  onPrev: () => void;
  onNext: () => void;
};

export function LearningDayHistoryCard({ monthStart, days, onPrev, onNext }: Props) {
  const studied = useMemo(() => {
    const set = new Set<string>();
    for (const d of days) if ((d.minutes ?? 0) > 0) set.add(d.date);
    return set;
  }, [days]);

  const monthLabel = `${monthStart.getFullYear()} • ${mn.insights.history.months[monthStart.getMonth()]}`;

  return (
    <SectionCard
      stackRight
      title={mn.insights.history.title}
      right={<RangeTabs active="monthly" enabled={['monthly']} />}
    >
      <View style={styles.head}>
        <Pressable onPress={onPrev} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
          <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
        </Pressable>
        <Text style={styles.month}>{monthLabel}</Text>
        <Pressable onPress={onNext} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </Pressable>
      </View>
      <MonthCalendar monthStart={monthStart} studied={studied} />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    paddingVertical: 8,
  },
  month: { ...typography.heading.sm, color: colors.text.primary },
  pressed: { opacity: 0.6 },
});
