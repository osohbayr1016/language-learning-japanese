import React from 'react';
import { View } from 'react-native';
import { MascotBubble } from './MascotBubble';
import { OptionCard } from './OptionCard';
import { mn } from '../../i18n/mn';
import type { JlptSelfLevel } from './types';
import { PlacementCheckCard } from './PlacementCheckCard';
import type { PlacementLevel } from './placement';

type Item = { id: JlptSelfLevel; title: string; subtitle: string };

const ITEMS: Item[] = [
  { id: 'none', title: mn.setup.levelNoneTitle, subtitle: mn.setup.levelNoneSub },
  { id: 'n5', title: mn.setup.levelN5Title, subtitle: mn.setup.levelN5Sub },
  { id: 'n4', title: mn.setup.levelN4Title, subtitle: mn.setup.levelN4Sub },
  { id: 'n3', title: mn.setup.levelN3Title, subtitle: mn.setup.levelN3Sub },
  { id: 'n2', title: mn.setup.levelN2Title, subtitle: mn.setup.levelN2Sub },
  { id: 'n1', title: mn.setup.levelN1Title, subtitle: mn.setup.levelN1Sub },
];

type Props = {
  value: JlptSelfLevel | null;
  placementLevel: PlacementLevel | null;
  onChange: (v: JlptSelfLevel) => void;
  onPlacementComplete: (v: PlacementLevel) => void;
};

export function LevelStep({
  value,
  placementLevel,
  onChange,
  onPlacementComplete,
}: Props) {
  return (
    <View>
      <MascotBubble message={mn.setup.levelTitle} />
      {ITEMS.map((it) => (
        <OptionCard
          key={it.id}
          title={it.title}
          subtitle={it.subtitle}
          selected={value === it.id}
          onPress={() => onChange(it.id)}
        />
      ))}
      {value && value !== 'none' && value !== 'n5' ? (
        <PlacementCheckCard result={placementLevel} onComplete={onPlacementComplete} />
      ) : null}
    </View>
  );
}
