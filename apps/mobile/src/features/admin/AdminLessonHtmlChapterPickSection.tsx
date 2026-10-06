import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { AdminChapter } from '../../lib/api/admin';
import { colors } from '../../theme';
import { buildChapterPickRows } from './adminLessonHtmlChapterRows';
import { lessonHtmlImportStyles as styles } from './AdminLessonHtmlImportStyles';

function jlptName(band: number): string {
  const safe = Math.min(5, Math.max(1, Number(band) || 1));
  return `JLPT N${6 - safe}`;
}

function chapterLabel(ch: AdminChapter) {
  return `${jlptName(ch.jlpt_level)} · ${ch.title_mn}`;
}

type Props = {
  token: string | null;
  chapters: AdminChapter[];
  chapterId: number | null;
  creatingJlptBand: number | null;
  onSelectChapter: (id: number) => void;
  onCreateChapterForJlptBand: (band: number) => void;
};

export function AdminLessonHtmlChapterPickSection({
  token,
  chapters,
  chapterId,
  creatingJlptBand,
  onSelectChapter,
  onCreateChapterForJlptBand,
}: Props) {
  const chapterRows = useMemo(() => buildChapterPickRows(chapters), [chapters]);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Бүлэг сонгох (JLPT N5–N1)</Text>
      <Text style={styles.hint}>
        Тухайн JLPT түвшинд бүлэг байхгүй бол «Бүлэг үүсгэх» дээр дарна уу.
      </Text>
      <View style={styles.row}>
        {chapterRows.map((row) =>
          row.type === 'missing' ? (
            <Pressable
              key={`missing-${row.jlptBand}`}
              accessibilityRole="button"
              accessibilityLabel={`${jlptName(row.jlptBand)} бүлэг үүсгэх`}
              disabled={!token || creatingJlptBand != null}
              style={[
                styles.chip,
                styles.chipCreate,
                (!token || creatingJlptBand != null) && styles.btnDis,
                creatingJlptBand === row.jlptBand && styles.chipOn,
              ]}
              onPress={() => onCreateChapterForJlptBand(row.jlptBand)}
            >
              {creatingJlptBand === row.jlptBand ? (
                <ActivityIndicator color={colors.brand.primary} />
              ) : (
                <Text style={styles.chipText}>
                  {jlptName(row.jlptBand)} · Бүлэг үүсгэх
                </Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              key={row.chapter.id}
              accessibilityRole="button"
              style={[styles.chip, row.chapter.id === chapterId && styles.chipOn]}
              onPress={() => onSelectChapter(row.chapter.id)}
            >
              <Text style={styles.chipText}>{chapterLabel(row.chapter)}</Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}
