import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../theme';
import type { SkillKey } from '../../lib/types';

const SIZE = 76;
const THICKNESS = 8;

const ICONS: Record<SkillKey, keyof typeof Ionicons.glyphMap> = {
  listening: 'headset',
  pronunciation: 'mic',
  pitch: 'musical-notes',
  recall: 'bulb',
  reading: 'book',
  stroke: 'create',
};

const TINTS: Record<SkillKey, string> = {
  listening: colors.info,
  pronunciation: colors.accent.pink,
  pitch: colors.warning,
  recall: colors.accent.purple,
  reading: colors.brand.secondary,
  stroke: colors.brand.primary,
};

type Props = {
  skill: SkillKey;
  ratio: number;
  total: number;
  label: string;
};

export function SkillGauge({ skill, ratio, total, label }: Props) {
  const r = (SIZE - THICKNESS) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, ratio)));
  const tint = TINTS[skill];
  const empty = total === 0;
  return (
    <View style={styles.wrap}>
      <View style={[styles.ring, { width: SIZE, height: SIZE }]}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={colors.borderLight} strokeWidth={THICKNESS} fill="none" />
          {!empty && (
            <Circle
              cx={SIZE / 2} cy={SIZE / 2} r={r}
              stroke={tint} strokeWidth={THICKNESS} strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={offset} fill="none"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          )}
        </Svg>
        <View style={styles.center}>
          <Ionicons name={ICONS[skill]} size={20} color={empty ? colors.text.muted : tint} />
        </View>
      </View>
      <Text style={styles.value}>{empty ? '–' : `${Math.round(ratio * 100)}%`}</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexBasis: '31%', alignItems: 'center', marginBottom: 12 },
  ring: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    width: SIZE - THICKNESS * 2, height: SIZE - THICKNESS * 2,
    borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
  },
  value: { ...typography.heading.sm, color: colors.text.primary, marginTop: 4 },
  label: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
});
