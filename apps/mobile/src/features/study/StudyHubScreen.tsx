import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen, Touchable } from '../../primitives';
import { useGamification } from '../../context/GamificationContext';
import { colors, radius, spacing, tint, typography } from '../../theme';

type PracticeItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  href: string;
  color: string;
};

const PRACTICE: PracticeItem[] = [
  {
    key: 'kana',
    title: 'Кана',
    subtitle: 'Хирагана · Катакана',
    icon: 'text-outline',
    href: '/kana',
    color: colors.accent.purple,
  },
  {
    key: 'kanji',
    title: 'Канжи',
    subtitle: 'Унших · Бичих',
    icon: 'language-outline',
    href: '/kanji',
    color: colors.accent.teal,
  },
  {
    key: 'speak',
    title: 'Ярих',
    subtitle: 'Дуудлага · Сонсгол',
    icon: 'mic-outline',
    href: '/study/speak',
    color: colors.success,
  },
  {
    key: 'grammar',
    title: 'Дүрэм',
    subtitle: 'Өгүүлбэр · Хэлбэр',
    icon: 'library-outline',
    href: '/study/grammar',
    color: colors.accent.blue,
  },
  {
    key: 'write',
    title: 'Бичих',
    subtitle: 'Үг · Өгүүлбэр',
    icon: 'create-outline',
    href: '/study/write',
    color: colors.accent.pink,
  },
  {
    key: 'games',
    title: 'Тоглоом',
    subtitle: 'Хурдан бататгал',
    icon: 'game-controller-outline',
    href: '/games',
    color: colors.accent.amber,
  },
];

function PracticeTile({ item }: { item: PracticeItem }) {
  const router = useRouter();
  return (
    <Touchable
      accessibilityLabel={item.title}
      accessibilityHint={item.subtitle}
      onPress={() => router.push(item.href as never)}
      hoverLift={3}
      style={styles.tile}
      hoveredStyle={{ borderColor: item.color, backgroundColor: tint(item.color, 0.04) }}
    >
      <View style={[styles.icon, { backgroundColor: tint(item.color, 0.12) }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={styles.tileTitle}>{item.title}</Text>
      <Text style={styles.tileSubtitle}>{item.subtitle}</Text>
    </Touchable>
  );
}

export default function StudyHubScreen() {
  const router = useRouter();
  const { dueToday } = useGamification();

  return (
    <Screen scroll scrollBottomInset={78}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ДАДЛАГА</Text>
        <Text style={styles.title}>Сул чадвараа хүчтэй болго</Text>
        <Text style={styles.subtitle}>
          Үндсэн хичээлийн зам Home дээр байна. Энд зөвхөн давталт ба ур чадварын дасгалууд.
        </Text>
      </View>

      <Touchable
        accessibilityLabel={
          dueToday > 0
            ? `${dueToday} үг давтах хугацаа болсон`
            : 'Давталтын дараалал хоосон'
        }
        onPress={() => router.push('/study/flashcard' as never)}
        haptic="medium"
        hoverLift={3}
        style={styles.reviewCard}
        hoveredStyle={styles.reviewHover}
      >
        <View style={styles.reviewIcon}>
          <Ionicons
            name={dueToday > 0 ? 'refresh' : 'checkmark'}
            size={30}
            color={dueToday > 0 ? colors.brand.primary : colors.success}
          />
        </View>
        <View style={styles.reviewCopy}>
          <Text style={styles.reviewKicker}>ӨНӨӨДРИЙН ДАВТАЛТ</Text>
          <Text style={styles.reviewTitle}>
            {dueToday > 0 ? `${dueToday} үг хүлээж байна` : 'Бүх давталт дууссан'}
          </Text>
          <Text style={styles.reviewSubtitle}>
            {dueToday > 0
              ? 'Мартахаас өмнө 5–10 минут сэргээ'
              : 'Хүсвэл өмнөх үгсээ дахин бататгаж болно'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.text.muted} />
      </Touchable>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Ур чадвар сонгох</Text>
        <Text style={styles.sectionSubtitle}>Нэг зүйл сонгоод 5–15 минут төвлөр</Text>
      </View>

      <View style={styles.grid}>
        {PRACTICE.map((item) => <PracticeTile key={item.key} item={item} />)}
      </View>

      <Touchable
        accessibilityLabel="JLPT mock шалгалт"
        accessibilityHint="Түвшнээ шалгах"
        onPress={() => router.push('/study/mock-exam' as never)}
        style={styles.examRow}
        hoveredStyle={{ borderColor: colors.warning }}
      >
        <View style={[styles.examIcon, { backgroundColor: tint(colors.warning, 0.12) }]}>
          <Ionicons name="trophy-outline" size={24} color={colors.warning} />
        </View>
        <View style={styles.examCopy}>
          <Text style={styles.examTitle}>JLPT checkpoint</Text>
          <Text style={styles.examSubtitle}>N5 ахиц болон дараагийн түвшний бэлэн байдлаа шалга</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
      </Touchable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading.xl,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    maxWidth: 480,
  },
  reviewCard: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    borderBottomColor: colors.borderStrong,
    borderRadius: radius.xl,
    backgroundColor: colors.bg.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  reviewHover: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.soft.brand,
  },
  reviewIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.elevated,
  },
  reviewCopy: { flex: 1 },
  reviewKicker: {
    ...typography.overline,
    color: colors.brand.primary,
    marginBottom: 3,
  },
  reviewTitle: {
    ...typography.heading.md,
    color: colors.text.primary,
  },
  reviewSubtitle: {
    ...typography.body.sm,
    color: colors.text.secondary,
    marginTop: 3,
  },
  sectionHead: { marginBottom: spacing.md },
  sectionTitle: {
    ...typography.heading.lg,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    ...typography.body.md,
    color: colors.text.secondary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 145,
    minHeight: 150,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    borderBottomColor: colors.borderStrong,
    borderRadius: radius.xl,
    backgroundColor: colors.bg.card,
    padding: spacing.md,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tileTitle: {
    ...typography.heading.md,
    color: colors.text.primary,
  },
  tileSubtitle: {
    ...typography.body.sm,
    color: colors.text.secondary,
    marginTop: 3,
  },
  examRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.bg.card,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  examIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examCopy: { flex: 1 },
  examTitle: {
    ...typography.heading.sm,
    color: colors.text.primary,
  },
  examSubtitle: {
    ...typography.body.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
