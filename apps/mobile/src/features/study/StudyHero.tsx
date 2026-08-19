import React from 'react';
import { useRouter } from 'expo-router';
import { HeroCard } from '../../primitives';
import { colors } from '../../theme';
import { useGamification } from '../../context/GamificationContext';
import { mn } from '../../i18n/mn';

type Plan = {
  title: string;
  subtitle: string;
  icon: 'albums' | 'school';
  href: string;
};

function planFor(due: number): Plan {
  if (due > 0) {
    return {
      title: mn.study.heroDueTitle,
      subtitle: mn.study.heroDueSubtitle.replace('{n}', String(due)),
      icon: 'albums',
      href: '/study/flashcard',
    };
  }
  return {
    title: mn.study.heroFallbackTitle,
    subtitle: mn.study.heroFallbackSubtitle,
    icon: 'school',
    href: '/study/learn',
  };
}

export function StudyHero() {
  const router = useRouter();
  const { dueToday } = useGamification();
  const p = planFor(dueToday);

  return (
    <HeroCard
      kicker={mn.study.recommended}
      title={p.title}
      subtitle={p.subtitle}
      ctaLabel={mn.study.startNow}
      icon={p.icon}
      color={colors.brand.primary}
      shadeColor={colors.brand.primaryDark}
      onPress={() => router.push(p.href as never)}
    />
  );
}
