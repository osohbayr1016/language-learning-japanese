import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SectionHeading, Touchable } from '../../primitives';
import { colors, radius, shadows, spacing, tint, typography } from '../../theme';
import { mn } from '../../i18n/mn';

type Action = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  href: string;
};

const ACTIONS: Action[] = [
  { key: 'flashcard', label: mn.study.flashcard, icon: 'albums-outline', color: colors.accent.purple, href: '/study/flashcard' },
  { key: 'learn', label: mn.study.learn, icon: 'school-outline', color: colors.accent.blue, href: '/study/learn' },
  { key: 'write', label: mn.study.write, icon: 'create-outline', color: colors.accent.teal, href: '/study/write' },
  { key: 'writer', label: mn.study.writer, icon: 'brush-outline', color: colors.accent.pink, href: '/study/writer' },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <SectionHeading title={mn.home.quickActions} />
      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <Touchable
            key={a.key}
            accessibilityLabel={a.label}
            onPress={() => router.push(a.href as never)}
            hoverLift={3}
            style={styles.tile}
            hoveredStyle={{ borderColor: a.color, backgroundColor: tint(a.color, 0.05) }}
          >
            <View style={[styles.iconBox, { backgroundColor: tint(a.color, 0.12) }]}>
              <Ionicons name={a.icon} size={24} color={a.color} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {a.label}
            </Text>
          </Touchable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.heading.sm, color: colors.text.primary, flexShrink: 1 },
});
