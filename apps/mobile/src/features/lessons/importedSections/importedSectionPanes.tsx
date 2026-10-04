import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ImportedLessonContent } from '../../../lib/types';
import { colors, radius, spacing, typography } from '../../../theme';
import { mn } from '../../../i18n/mn';

const styles = StyleSheet.create({
  jp: { ...typography.heading.md, color: colors.text.primary },
  mnTitle: { ...typography.body.md, color: colors.text.secondary, fontWeight: '700' },
  p: { ...typography.body.sm, color: colors.text.secondary, lineHeight: 21 },
  block: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bg.secondary,
    gap: spacing.xs,
  },
  h: { ...typography.body.md, color: colors.text.primary, fontWeight: '800' },
  line: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.xs },
  speaker: { ...typography.body.sm, color: colors.brand.primary, fontWeight: '800' },
  jpLine: { ...typography.body.md, color: colors.text.primary, fontWeight: '700', lineHeight: 24 },
});

export function SummaryPane({ content }: { content: ImportedLessonContent }) {
  const s = content.summary?.trim();
  if (!s) return <Text style={styles.p}>{mn.lesson.importedEmptySummary}</Text>;
  return <Text style={styles.p}>{s}</Text>;
}

/** Зөвхөн ярианы мөртэй хэсгүүд; урт өгүүлбэр easy-texts хэсэгт. */
export function DialoguePane({ content }: { content: ImportedLessonContent }) {
  const blocks = content.dialogues.filter((d) => (d.lines?.length ?? 0) > 0);
  if (!blocks.length) {
    return <Text style={styles.p}>{mn.lesson.importedEmptyDialogue}</Text>;
  }
  return (
    <>
      <Text style={styles.jp}>{content.title_jp}</Text>
      <Text style={styles.mnTitle}>{content.title_mn}</Text>
      {blocks.map((d) => (
        <View key={`${d.no}-${d.title}`} style={styles.block}>
          <Text style={styles.h}>{d.title}</Text>
          {d.lines!.map((l, i) => (
            <View key={`${l.jp}-${i}`} style={styles.line}>
              {l.speaker ? <Text style={styles.speaker}>{l.speaker}</Text> : null}
              <Text style={styles.jpLine}>{l.jp}</Text>
              <Text style={styles.p}>{l.mn}</Text>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

export function EasyTextsPane({ content }: { content: ImportedLessonContent }) {
  const blocks = content.dialogues.filter((d) => Boolean(d.text_jp?.trim()));
  if (!blocks.length) {
    return <Text style={styles.p}>{mn.lesson.importedEmptyEasyTexts}</Text>;
  }
  return (
    <>
      {blocks.map((d) => (
        <View key={`ez-${d.no}-${d.title}`} style={styles.block}>
          <Text style={styles.h}>{d.title}</Text>
          <Text style={styles.jpLine}>{d.text_jp}</Text>
          {d.text_mn ? <Text style={styles.p}>{d.text_mn}</Text> : null}
        </View>
      ))}
    </>
  );
}

export { VocabPane } from './VocabPane';

export function NotesPane({
  title,
  rows,
}: {
  title: string;
  rows: { title: string; body: string }[];
}) {
  if (!rows.length) return <Text style={styles.p}>{title} — {mn.lesson.importedEmptyBlock}</Text>;
  return (
    <>
      {rows.map((n, i) => (
        <View key={`${n.title}-${i}`} style={styles.block}>
          <Text style={styles.h}>{n.title}</Text>
          <Text style={styles.p}>{n.body}</Text>
        </View>
      ))}
    </>
  );
}
