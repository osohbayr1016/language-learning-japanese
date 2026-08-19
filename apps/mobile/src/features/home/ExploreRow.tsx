import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SectionHeading, Touchable } from '../../primitives';
import { colors, radius, shadows, spacing, tint, typography } from '../../theme';
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
  { key: 'games', title: mn.tabs.games, icon: 'game-controller', color: colors.accent.purple, href: '/(tabs)/games' },
  { key: 'kanji', title: mn.tabs.kanji, icon: 'language', color: colors.accent.pink, href: '/(tabs)/kanji' },
];

export function ExploreRow() {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <SectionHeading title={mn.home.moreShortcuts} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroller}
      >
        {ITEMS.map((it) => (
          <Touchable
            key={it.key}
            accessibilityLabel={it.title}
            onPress={() => router.push(it.href as never)}
            hoverLift={3}
            style={styles.tile}
            hoveredStyle={{ borderColor: it.color, backgroundColor: tint(it.color, 0.05) }}
          >
            <View style={[styles.iconBox, { backgroundColor: tint(it.color, 0.12) }]}>
              <Ionicons name={it.icon} size={24} color={it.color} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {it.title}
            </Text>
          </Touchable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  scroller: { gap: spacing.sm, paddingRight: spacing.md, paddingBottom: spacing.xs },
  tile: {
    width: 110,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
