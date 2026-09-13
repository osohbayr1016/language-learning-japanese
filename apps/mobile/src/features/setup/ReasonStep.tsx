import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { MascotBubble } from './MascotBubble';
import { OptionCard } from './OptionCard';
import { mn } from '../../i18n/mn';
import type { LearningReason } from './types';

type Item = {
  id: LearningReason;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

const ITEMS: Item[] = [
  { id: 'university', title: mn.setup.reasonUniversity, subtitle: mn.setup.reasonUniversitySub, icon: 'school', color: colors.accent.blue },
  { id: 'career', title: mn.setup.reasonCareer, subtitle: mn.setup.reasonCareerSub, icon: 'briefcase', color: colors.accent.amber },
  { id: 'travel', title: mn.setup.reasonTravel, subtitle: mn.setup.reasonTravelSub, icon: 'airplane', color: colors.accent.teal },
  { id: 'culture', title: mn.setup.reasonCulture, subtitle: mn.setup.reasonCultureSub, icon: 'flower', color: colors.accent.pink },
  { id: 'fun', title: mn.setup.reasonFun, subtitle: mn.setup.reasonFunSub, icon: 'color-palette', color: colors.accent.purple },
];

type Props = {
  value: LearningReason | null;
  onChange: (v: LearningReason) => void;
};

export function ReasonStep({ value, onChange }: Props) {
  return (
    <View>
      <MascotBubble message={mn.setup.reasonTitle} />
      {ITEMS.map((it) => (
        <OptionCard
          key={it.id}
          title={it.title}
          subtitle={it.subtitle}
          selected={value === it.id}
          onPress={() => onChange(it.id)}
          icon={<Ionicons name={it.icon} size={26} color={it.color} />}
        />
      ))}
    </View>
  );
}
