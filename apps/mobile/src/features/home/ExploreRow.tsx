import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '../../theme';
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
  { key: 'cartoons', title: mn.tabs.cartoons, icon: 'play-circle', color: colors.accent.pink, href: '/(tabs)/cartoons' },
];

export function ExploreRow() {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{mn.home.moreShortcuts}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroller}>
        {ITEMS.map((it) => (
          <Pressable
            key={it.key}
            accessibilityRole="button"
            accessibilityLabel={it.title}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            onPress={() => router.push(it.href as never)}
          >
            <View style={[styles.iconBox, { backgroundColor: `${it.color}22` }]}>
              <Ionicons name={it.icon} size={24} color={it.color} />
            </View>
            <Text style={styles.label} numberOfLines={1}>{it.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  title: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.md },
  scroller: { gap: spacing.sm, paddingRight: spacing.md },
  tile: {
    width: 110,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.body.sm, color: colors.text.primary, textAlign: 'center' },
});
