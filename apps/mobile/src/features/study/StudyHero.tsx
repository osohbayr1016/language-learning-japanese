import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { HeroCard } from '../../primitives';
import { colors } from '../../theme';
import { useGamification } from '../../context/GamificationContext';
import { mn } from '../../i18n/mn';
import type { Chapter } from '../../lib/types';

type Plan = {
  title: string;
  subtitle: string;
  icon: 'albums' | 'school';
  href: string;
};

type Props = { chapters: Chapter[]; lessonsLoading: boolean };

export function StudyHero({ chapters, lessonsLoading }: Props) {
  const router = useRouter();
  const { dueToday } = useGamification();

  const nextLessonId = useMemo(() => {
    const ordered = chapters
      .filter((chapter) => !chapter.locked_below_advance_gate)
      .sort((a, b) => a.jlpt_level - b.jlpt_level || a.order_num - b.order_num)
      .flatMap((chapter) =>
        [...(chapter.lessons ?? [])].sort((a, b) => a.order_num - b.order_num),
      );
    return ordered.find((lesson) => !lesson.progress?.completed_at)?.id ?? ordered[0]?.id ?? null;
  }, [chapters]);

  const plan: Plan = dueToday > 0
    ? {
        title: mn.study.heroDueTitle,
        subtitle: mn.study.heroDueSubtitle.replace('{n}', String(dueToday)),
        icon: 'albums',
        href: '/study/flashcard',
      }
    : nextLessonId != null
      ? {
          title: 'Дараагийн хичээлээ үргэлжлүүлэх',
          subtitle: 'JLPT замаараа нэг алхам урагшил',
          icon: 'school',
          href: `/lessons/${nextLessonId}`,
        }
      : {
          title: lessonsLoading ? 'Хичээлийн замыг ачаалж байна…' : mn.study.heroFallbackTitle,
          subtitle: lessonsLoading ? 'Түр хүлээлгүйгээр давталтын горимоо сонгож болно' : mn.study.heroFallbackSubtitle,
          icon: 'school',
          href: '/study/learn',
        };

  return (
    <HeroCard
      kicker={mn.study.recommended}
      title={plan.title}
      subtitle={plan.subtitle}
      ctaLabel={mn.study.startNow}
      icon={plan.icon}
      color={colors.brand.primary}
      shadeColor={colors.brand.primaryDark}
      onPress={() => router.push(plan.href as never)}
    />
  );
}
