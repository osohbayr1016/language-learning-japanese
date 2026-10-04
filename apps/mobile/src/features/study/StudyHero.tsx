import React from 'react';
import { useRouter } from 'expo-router';
import { HeroCard } from '../../primitives';
import { colors } from '../../theme';
import { mn } from '../../i18n/mn';
import type { StudyNextAction } from '../../lib/api/user';

type Props = {
  action: StudyNextAction | null;
  loading: boolean;
};

export function StudyHero({ action, loading }: Props) {
  const router = useRouter();

  const plan = action ?? {
    kind: 'explore' as const,
    title: loading ? 'Өнөөдрийн төлөвлөгөөг бэлдэж байна…' : 'Япон хэлний сууриа бататгах',
    subtitle: loading ? 'Таны давталт, хичээл, сул чадварыг шалгаж байна' : 'Хирагана, катакана болон суурь чадвараа давтаарай',
    href: '/kana',
    reason: 'loading_fallback',
  };

  return (
    <HeroCard
      kicker={mn.study.recommended}
      title={plan.title}
      subtitle={plan.subtitle}
      ctaLabel={mn.study.startNow}
      icon={plan.kind === 'review' ? 'albums' : 'school'}
      color={colors.brand.primary}
      shadeColor={colors.brand.primaryDark}
      onPress={() => router.push(plan.href as never)}
    />
  );
}
