import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import type { InsightsSkills, SkillKey } from '../../lib/types';
import { SectionCard } from './SectionCard';
import { SkillGauge } from './SkillGauge';

const ORDER: SkillKey[] = ['listening', 'pronunciation', 'pitch', 'recall', 'reading', 'stroke'];

type Props = { skills: InsightsSkills | null };

export function GrowthAreaCard({ skills }: Props) {
  const allEmpty =
    !skills || ORDER.every((k) => (skills?.[k]?.total ?? 0) === 0);

  return (
    <SectionCard title={mn.insights.growth.title}>
      {allEmpty ? (
        <Text style={styles.empty}>{mn.insights.growth.empty}</Text>
      ) : (
        <View style={styles.grid}>
          {ORDER.map((k) => (
            <SkillGauge
              key={k}
              skill={k}
              ratio={skills![k].ratio}
              total={skills![k].total}
              label={mn.insights.skills[k]}
            />
          ))}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  empty: { ...typography.body.md, color: colors.text.secondary, textAlign: 'center', paddingVertical: 12 },
});
