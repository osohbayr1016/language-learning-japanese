import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { AdminChapter } from '../../lib/api/admin';
import { colors } from '../../theme';
import { buildChapterPickRows } from './adminLessonHtmlChapterRows';
import { lessonHtmlImportStyles as styles } from './AdminLessonHtmlImportStyles';

function chapterLabel(ch: AdminChapter) {
  return `JLPT N${6-ch.jlpt_level} · ${ch.title_mn}`;
}

type Props = {
  token: string | null;
  chapters: AdminChapter[];
  chapterId: number | null;
  creatingJlpt: number | null;
  onSelectChapter: (id: number) => void;
  onCreateChapterForJlpt: (jlpt: number) => void;
};

export function AdminLessonHtmlChapterPickSection({
  token,
  chapters,
  chapterId,
  creatingJlpt,
  onSelectChapter,
  onCreateChapterForJlpt,
}: Props) {
  const chapterRows = useMemo(() => buildChapterPickRows(chapters), [chapters]);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Бүлэг сонгох (JLPT N5–5)</Text>
      <Text style={styles.hint}>Дараагийн JLPT-д бүлэг байхгүй бол «Бүлэг үүсгэх» чип дээр дарна уу — бүлэг серверт нэмэгдэнэ.</Text>
      <View style={styles.row}>
        {chapterRows.map((row) =>
          row.type === 'missing' ? (
            <Pressable
              key={`missing-${row.jlpt}`}
              accessibilityRole="button"
              accessibilityLabel={`JLPT N${6-row.jlpt} бүлэг үүсгэх`}
              disabled={!token || creatingJlpt != null}
              style={[
                styles.chip,
                styles.chipCreate,
                (!token || creatingJlpt != null) && styles.btnDis,
                creatingJlpt === row.jlpt && styles.chipOn,
              ]}
              onPress={() => onCreateChapterForJlpt(row.jlpt)}
            >
              {creatingJlpt === row.jlpt ? (
                <ActivityIndicator color={colors.brand.primary} />
              ) : (
                <Text style={styles.chipText}>JLPT N{6-row.jlpt} · Бүлэг үүсгэх</Text>
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
