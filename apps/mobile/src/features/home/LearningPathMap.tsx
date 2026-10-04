import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Touchable } from '../../primitives';
import { colors, motion, radius, spacing, tint, typography } from '../../theme';
import type { Chapter, Lesson } from '../../lib/types';

type Props = {
  chapters: Chapter[];
  dataReliable: boolean;
};

type PathLesson = {
  lesson: Lesson;
  chapter: Chapter;
  state: 'done' | 'current' | 'future' | 'locked';
};

const OFFSETS = [-46, 0, 46, 0];

function jlptLabel(level: number) {
  return `N${6 - level}`;
}

function lessonIcon(lesson: Lesson): React.ComponentProps<typeof Ionicons>['name'] {
  const raw = String(lesson.icon ?? '').toLowerCase();
  if (raw.includes('chat') || raw.includes('speak')) return 'chatbubbles';
  if (raw.includes('listen') || raw.includes('head')) return 'headset';
  if (raw.includes('write') || raw.includes('pen')) return 'pencil';
  if (raw.includes('kanji') || raw.includes('language')) return 'language';
  return 'star';
}

export function LearningPathMap({ chapters, dataReliable }: Props) {
  const router = useRouter();

  const path = useMemo(() => {
    const orderedChapters = [...chapters].sort(
      (a, b) => a.jlpt_level - b.jlpt_level || a.order_num - b.order_num,
    );

    const flat: Array<{ lesson: Lesson; chapter: Chapter }> = [];
    orderedChapters.forEach((chapter) => {
      [...(chapter.lessons ?? [])]
        .sort((a, b) => a.order_num - b.order_num)
        .forEach((lesson) => flat.push({ lesson, chapter }));
    });

    let currentAssigned = false;
    return flat.map<PathLesson>(({ lesson, chapter }) => {
      if (chapter.locked_below_advance_gate) {
        return { lesson, chapter, state: 'locked' };
      }
      if (dataReliable && lesson.progress?.completed_at) {
        return { lesson, chapter, state: 'done' };
      }
      if (!currentAssigned) {
        currentAssigned = true;
        return { lesson, chapter, state: 'current' };
      }
      return { lesson, chapter, state: 'future' };
    });
  }, [chapters, dataReliable]);

  if (path.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="map-outline" size={34} color={colors.text.muted} />
        <Text style={styles.emptyTitle}>Суралцах зам одоогоор хоосон байна</Text>
        <Text style={styles.emptyBody}>Нийтлэгдсэн хичээл орж ирэхэд энд дарааллаараа харагдана.</Text>
      </View>
    );
  }

  let previousChapterId: number | null = null;

  return (
    <View style={styles.wrap}>
      {path.map((item, index) => {
        const chapterChanged = previousChapterId !== item.chapter.id;
        previousChapterId = item.chapter.id;

        const offset = OFFSETS[index % OFFSETS.length];
        const done = item.state === 'done';
        const current = item.state === 'current';
        const locked = item.state === 'locked';
        const disabled = item.state === 'future' || locked;
        const nodeColor = locked
          ? colors.text.faint
          : done
            ? colors.success
            : current
              ? colors.brand.primary
              : colors.borderStrong;

        return (
          <React.Fragment key={item.lesson.id}>
            {chapterChanged ? (
              <View style={styles.chapterBanner}>
                <View style={styles.chapterPill}>
                  <Text style={styles.chapterLevel}>{jlptLabel(item.chapter.jlpt_level)}</Text>
                </View>
                <View style={styles.chapterCopy}>
                  <Text style={styles.chapterTitle}>{item.chapter.title_mn}</Text>
                  {item.chapter.subtitle_mn ? (
                    <Text style={styles.chapterSubtitle}>{item.chapter.subtitle_mn}</Text>
                  ) : null}
                </View>
                {item.chapter.locked_below_advance_gate ? (
                  <Ionicons name="lock-closed" size={18} color={colors.text.muted} />
                ) : null}
              </View>
            ) : null}

            <View style={styles.nodeRow}>
              {index < path.length - 1 ? <View style={styles.connector} /> : null}
              <View style={{ transform: [{ translateX: offset }] }}>
                {current ? (
                  <View style={styles.currentLabel}>
                    <Text style={styles.currentLabelText}>ОДОО</Text>
                  </View>
                ) : null}

                <Touchable
                  accessibilityLabel={
                    locked
                      ? `${item.lesson.title_mn}. Түгжээтэй`
                      : `${item.lesson.title_mn}. ${done ? 'Дууссан' : current ? 'Одоо сурах' : 'Дараагийн хичээл'}`
                  }
                  accessibilityHint={
                    disabled ? 'Өмнөх хичээлээ дуусгаад нээгдэнэ' : 'Хичээл нээх'
                  }
                  disabled={disabled}
                  haptic={current ? 'medium' : 'light'}
                  hoverLift={disabled ? 0 : 4}
                  scaleTo={motion.scale.press}
                  onPress={() => router.push(`/lessons/${item.lesson.id}` as never)}
                  style={[
                    styles.node,
                    {
                      backgroundColor: done
                        ? tint(colors.success, 0.12)
                        : current
                          ? colors.brand.primary
                          : colors.bg.elevated,
                      borderColor: nodeColor,
                    },
                    current ? styles.currentNode : null,
                  ]}
                >
                  <Ionicons
                    name={
                      locked
                        ? 'lock-closed'
                        : done
                          ? 'checkmark'
                          : lessonIcon(item.lesson)
                    }
                    size={current ? 32 : 28}
                    color={current ? colors.text.inverse : nodeColor}
                  />
                </Touchable>

                <View style={styles.lessonCopy}>
                  <Text
                    style={[
                      styles.lessonTitle,
                      current ? styles.lessonTitleCurrent : null,
                      locked ? styles.lessonTitleMuted : null,
                    ]}
                    numberOfLines={2}
                  >
                    {item.lesson.title_mn}
                  </Text>
                  {current && item.lesson.subtitle_mn ? (
                    <Text style={styles.lessonSubtitle} numberOfLines={2}>
                      {item.lesson.subtitle_mn}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  chapterBanner: {
    minHeight: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chapterPill: {
    minWidth: 48,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  chapterLevel: {
    ...typography.heading.sm,
    color: colors.text.inverse,
    fontWeight: '900',
  },
  chapterCopy: { flex: 1 },
  chapterTitle: { ...typography.heading.md, color: colors.text.inverse },
  chapterSubtitle: {
    ...typography.body.sm,
    color: colors.text.inverse,
    opacity: 0.88,
    marginTop: 2,
  },
  nodeRow: {
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 72,
    bottom: -12,
    width: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  node: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentNode: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderColor: colors.brand.primaryDark,
    borderBottomWidth: 8,
  },
  currentLabel: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    zIndex: 2,
    backgroundColor: colors.text.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  currentLabelText: {
    ...typography.body.xs,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: colors.text.inverse,
  },
  lessonCopy: {
    position: 'absolute',
    top: 86,
    width: 180,
    left: -49,
    alignItems: 'center',
  },
  lessonTitle: {
    ...typography.body.sm,
    fontWeight: '800',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  lessonTitleCurrent: { color: colors.text.primary },
  lessonTitleMuted: { color: colors.text.muted },
  lessonSubtitle: {
    ...typography.body.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.heading.md,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body.md,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 340,
  },
});
