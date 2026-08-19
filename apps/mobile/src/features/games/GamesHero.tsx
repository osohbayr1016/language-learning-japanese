import React from 'react';
import { useRouter } from 'expo-router';
import { HeroCard } from '../../primitives';
import { colors } from '../../theme';
import { mn } from '../../i18n/mn';
import { gameByKey } from './registry';
import type { GameSessionRow } from './useGamesStats';

type Props = { lastPlayed: GameSessionRow | null };

/** Darker plinth tone per accent, so the card keeps its 3D edge. */
const SHADE: Record<string, string> = {
  [colors.accent.purple]: '#6C3BAB',
  [colors.accent.blue]: '#20606A',
  [colors.accent.teal]: '#086274',
  [colors.accent.pink]: '#9B3D49',
};

export function GamesHero({ lastPlayed }: Props) {
  const router = useRouter();
  const meta = gameByKey(lastPlayed?.game_type);
  const subtitle = lastPlayed
    ? `${mn.games.lastPlayed}: ${lastPlayed.score} ${mn.games.scoreUnit}`
    : mn.games.noHistory;

  return (
    <HeroCard
      kicker={mn.games.recommended}
      title={meta.title}
      subtitle={subtitle}
      ctaLabel={mn.games.startNow}
      icon={meta.iconSolid}
      color={meta.color}
      shadeColor={SHADE[meta.color] ?? colors.brand.primaryDark}
      onPress={() => router.push(meta.href as never)}
    />
  );
}
