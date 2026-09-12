import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Touchable } from '../../primitives/Touchable';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { useLearnedKanjis } from '../../hooks/useLearnedKanjis';

type Tile = {
  key: string;
  glyph?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  sub: string;
  color: string;
  href: string;
};

/**
 * The three places a learner goes from the study hub. These used to show
 * made-up progress bars (45 %, 12 %) that never changed; now each tile shows a
 * real count where one exists and otherwise just takes you there.
 */
export function StudyPathProgressCards() {
  const router = useRouter();
  const { kanjis } = useLearnedKanjis();
  const learnedKanji = kanjis.length;

  const tiles: Tile[] = [
    {
      key: 'kana',
      glyph: 'あ',
      title: mn.tabs.kana,
      sub: 'Хирагана · Катакана',
      color: colors.accent.blue,
      href: '/(tabs)/games',
    },
    {
      key: 'kanji',
      glyph: '漢',
      title: mn.tabs.kanji,
      sub: learnedKanji > 0 ? `${learnedKanji} ханз сурсан` : 'N5 ханзууд',
      color: colors.accent.purple,
      href: '/(tabs)/kanji',
    },
    {
      key: 'games',
      icon: 'game-controller',
      title: mn.tabs.games,
      sub: 'Тоглож давт',
      color: colors.accent.pink,
      href: '/games',
    },
  ];

  return (
    <View style={styles.container}>
      {tiles.map((t) => (
        <Touchable
          key={t.key}
          onPress={() => router.push(t.href as never)}
          accessibilityLabel={`${t.title}. ${t.sub}`}
          style={styles.card}
          hoveredStyle={{ borderColor: t.color }}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${t.color}1F` }]}>
            {t.glyph ? (
              <Text style={[styles.iconChar, { color: t.color }]}>{t.glyph}</Text>
            ) : (
              <Ionicons name={t.icon} size={20} color={t.color} />
            )}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {t.title}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {t.sub}
          </Text>
        </Touchable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    ...shadows.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconChar: { ...typography.heading.md },
  title: { ...typography.heading.sm, color: colors.text.primary },
  sub: { ...typography.body.xs, color: colors.text.muted },
});
