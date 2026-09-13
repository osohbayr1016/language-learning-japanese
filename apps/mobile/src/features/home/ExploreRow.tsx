import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Touchable } from '../../primitives/Touchable';
import { mn } from '../../i18n/mn';

type Item = {
  key: string;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  href: string;
};

/** Нүүр дээр давхардахгүйгээр зөвхөн таб / төв хаб руу — тоглоом тус бүр Games табнаас. */
const ITEMS: Item[] = [
  { key: 'study', title: mn.tabs.study, icon: 'book', color: colors.accent.blue, href: '/(tabs)/study' },
  { key: 'kana', title: mn.tabs.kana, icon: 'apps', color: colors.accent.purple, href: '/(tabs)/games' },
  { key: 'games', title: mn.tabs.games, icon: 'game-controller', color: colors.accent.pink, href: '/games' },
  { key: 'kanji', title: mn.tabs.kanji, icon: 'language', color: colors.accent.teal, href: '/(tabs)/kanji' },
];

/**
 * Four equal tiles that fit the column. This was a horizontal scroller that
 * cut the fourth tile in half at phone width, which read as a layout bug
 * rather than as "there is more".
 */
export function ExploreRow() {
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {ITEMS.map((it) => (
        <Touchable
          key={it.key}
          accessibilityLabel={it.title}
          style={styles.tile}
          hoveredStyle={{ borderColor: it.color }}
          onPress={() => router.push(it.href as never)}
        >
          <View style={[styles.iconBox, { backgroundColor: `${it.color}1F` }]}>
            <Ionicons name={it.icon} size={22} color={it.color} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {it.title}
          </Text>
        </Touchable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.body.sm, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
});
