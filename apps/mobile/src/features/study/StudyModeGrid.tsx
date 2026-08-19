import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SectionHeading, Touchable } from '../../primitives';
import { colors, motion, radius, shadows, spacing, tint, typography } from '../../theme';
import { mn } from '../../i18n/mn';

type Mode = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  href: string;
};

const MODES: Mode[] = [
  {
    key: 'flashcard',
    title: mn.study.flashcard,
    subtitle: mn.study.flashcardDesc,
    icon: 'albums-outline',
    color: colors.accent.purple,
    href: '/study/flashcard',
  },
  {
    key: 'learn',
    title: mn.study.learn,
    subtitle: mn.study.learnDesc,
    icon: 'school-outline',
    color: colors.accent.blue,
    href: '/study/learn',
  },
  {
    key: 'weak',
    title: mn.study.weakReviewTitle,
    subtitle: mn.study.weakReviewDesc,
    icon: 'fitness-outline',
    color: colors.error,
    href: '/study/weak',
  },
  {
    key: 'write',
    title: mn.study.write,
    subtitle: mn.study.writeDesc,
    icon: 'create-outline',
    color: colors.accent.teal,
    href: '/study/write',
  },
  {
    key: 'writer',
    title: mn.study.writer,
    subtitle: mn.study.writerDesc,
    icon: 'brush-outline',
    color: colors.accent.pink,
    href: '/study/writer',
  },
  {
    key: 'speak',
    title: mn.study.speak,
    subtitle: mn.study.speakDesc,
    icon: 'mic-outline',
    color: colors.success,
    href: '/study/speak',
  },
  {
    key: 'grammar',
    title: mn.study.grammarTitle,
    subtitle: mn.study.grammarDesc,
    icon: 'library-outline',
    color: colors.warning,
    href: '/study/grammar',
  },
  {
    key: 'mock',
    title: mn.study.mockExamTitle,
    subtitle: mn.study.mockExamDesc,
    icon: 'clipboard-outline',
    color: colors.accent.amber,
    href: '/study/mock-exam',
  },
];

function a11y(mode: Mode) {
  return { accessibilityLabel: mode.title, accessibilityHint: mode.subtitle };
}

function LargeCard({ mode, onPress }: { mode: Mode; onPress: () => void }) {
  return (
    <Touchable
      {...a11y(mode)}
      onPress={onPress}
      scaleTo={motion.scale.pressLg}
      hoverLift={3}
      style={[styles.largeCard, { borderColor: colors.border }]}
      hoveredStyle={{ borderColor: mode.color, backgroundColor: tint(mode.color, 0.04) }}
    >
      <View style={[styles.largeIconBox, { backgroundColor: tint(mode.color, 0.12) }]}>
        <Ionicons name={mode.icon} size={30} color={mode.color} />
      </View>
      <View style={styles.largeBody}>
        <Text style={styles.largeTitle}>{mode.title}</Text>
        <Text style={styles.largeSubtitle}>{mode.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={mode.color} />
    </Touchable>
  );
}

function HalfCard({ mode, onPress }: { mode: Mode; onPress: () => void }) {
  return (
    <Touchable
      {...a11y(mode)}
      onPress={onPress}
      hoverLift={3}
      style={[styles.halfCard, { borderTopColor: mode.color }]}
      hoveredStyle={{ backgroundColor: tint(mode.color, 0.05) }}
    >
      <View style={[styles.halfIconBox, { backgroundColor: tint(mode.color, 0.12) }]}>
        <Ionicons name={mode.icon} size={22} color={mode.color} />
      </View>
      <Text style={styles.halfTitle} numberOfLines={1}>
        {mode.title}
      </Text>
      <Text style={styles.halfSubtitle} numberOfLines={2}>
        {mode.subtitle}
      </Text>
    </Touchable>
  );
}

function ListRow({ mode, onPress, last }: { mode: Mode; onPress: () => void; last?: boolean }) {
  return (
    <Touchable
      {...a11y(mode)}
      onPress={onPress}
      hoverLift={0}
      hoverShadow={false}
      scaleTo={motion.scale.pressLg}
      style={[styles.listRow, last ? styles.listRowLast : null]}
      hoveredStyle={{ backgroundColor: colors.bg.washi }}
    >
      <View style={[styles.listIconBox, { backgroundColor: tint(mode.color, 0.12) }]}>
        <Ionicons name={mode.icon} size={20} color={mode.color} />
      </View>
      <View style={styles.listBody}>
        <Text style={styles.listTitle}>{mode.title}</Text>
        <Text style={styles.listSubtitle} numberOfLines={1}>
          {mode.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
    </Touchable>
  );
}

export function StudyModeGrid() {
  const router = useRouter();
  const go = (m: Mode) => () => router.push(m.href as never);
  const getMode = (key: string) => MODES.find((m) => m.key === key)!;

  const flashcard = getMode('flashcard');
  const grammar = getMode('grammar');
  const mock = getMode('mock');

  return (
    <View style={styles.container}>
      <SectionHeading
        step={1}
        title="Өдөр тутмын давталт"
        subtitle="Мартахаас өмнө сэргээх — өдөр бүр эндээс эхэл"
      />
      <LargeCard mode={flashcard} onPress={go(flashcard)} />

      <SectionHeading
        step={2}
        title="Ур чадвар хөгжүүлэх"
        subtitle="Сул талаа сонгон дадлагажуул"
      />
      <View style={styles.row}>
        <HalfCard mode={getMode('weak')} onPress={go(getMode('weak'))} />
        <HalfCard mode={getMode('writer')} onPress={go(getMode('writer'))} />
      </View>
      <View style={styles.row}>
        <HalfCard mode={getMode('speak')} onPress={go(getMode('speak'))} />
        <HalfCard mode={getMode('write')} onPress={go(getMode('write'))} />
      </View>

      <SectionHeading step={3} title="Нэмэлт ба Шалгалт" subtitle="Дүрэм судлах, түвшин шалгах" />
      <View style={styles.listContainer}>
        <ListRow mode={grammar} onPress={go(grammar)} />
        <ListRow mode={mock} onPress={go(mock)} last />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  largeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  largeIconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  largeBody: { flex: 1 },
  largeTitle: { ...typography.heading.md, color: colors.text.primary, marginBottom: 2 },
  largeSubtitle: { ...typography.body.sm, color: colors.text.secondary },
  halfCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  halfIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  halfTitle: { ...typography.heading.sm, color: colors.text.primary, marginBottom: 2 },
  halfSubtitle: { ...typography.body.xs, color: colors.text.secondary },
  listContainer: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  listRowLast: { borderBottomWidth: 0 },
  listIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  listBody: { flex: 1 },
  listTitle: { ...typography.body.md, fontWeight: '700', color: colors.text.primary },
  listSubtitle: { ...typography.body.xs, color: colors.text.secondary, marginTop: 2 },
});
