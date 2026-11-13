import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WordWithProgress } from '../../lib/types';
import { formatNextReviewDate } from '../../lib/formatNextReview';
import { mn } from '../../i18n/mn';
import { colors, spacing, typography } from '../../theme';

export function isFlashcardWaiting(el?: string | null) {
  if (!el) return false;
  return new Date(el).getTime() > Date.now();
}

type Props = {
  item: WordWithProgress;
  onOpenDetail: (wordId: number) => void;
  onPromote: (wordId: number) => void;
};

export function VocabularyWordRow({ item, onOpenDetail, onPromote }: Props) {
  const waiting = isFlashcardWaiting(item.flashcard_eligible_at);
  return (
    <View style={styles.row}>
      <Pressable style={styles.rowMain} onPress={() => onOpenDetail(item.id)}>
        <Text style={styles.kanji}>{item.kanji}</Text>
        <Text style={styles.meta}>{item.romaji}</Text>
        <Text style={styles.meaning} numberOfLines={2}>
          {item.meaning_mn}
        </Text>
        {waiting ? (
          <Text style={styles.wait}>
            {mn.profile.flashcardWaiting}: {new Date(item.flashcard_eligible_at!).toLocaleDateString()}
          </Text>
        ) : item.next_review ? (
          <Text style={styles.nextRev} numberOfLines={1}>
            {mn.profile.nextReview}: {formatNextReviewDate(item.next_review) ?? item.next_review}
          </Text>
        ) : null}
      </Pressable>
      {waiting ? (
        <Pressable style={styles.promoteBtn} onPress={() => onPromote(item.id)}>
          <Text style={styles.promoteTxt}>{mn.profile.flashcardReady}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowMain: { flex: 1, minWidth: 0 },
  kanji: { ...typography.heading.md, color: colors.text.primary },
  meta: { ...typography.body.sm, color: colors.text.secondary, marginTop: 2 },
  meaning: { ...typography.body.sm, color: colors.text.primary, marginTop: 4 },
  wait: { ...typography.body.sm, color: colors.accent.amber, marginTop: 4 },
  nextRev: { ...typography.body.sm, color: colors.text.muted, marginTop: 4 },
  promoteBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.accent.teal,
    borderRadius: 8,
  },
  promoteTxt: { ...typography.body.sm, color: '#fff', fontWeight: '700' },
});
