import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Href } from 'expo-router';
import type { AdminChapter } from '../../lib/api/admin';
import { mn } from '../../i18n/mn';
import { learningPathStyles as styles } from './AdminLearningPathStyles';
import { lessonCount } from './adminLessonTreeSections';

type Props = {
  ch: AdminChapter;
  draftTitle: string;
  onDraftTitle: (t: string) => void;
  onSaveDelay: (raw: string) => void;
  onTogglePublish: () => void;
  onAddLesson: () => void;
  onOpenLesson: (href: Href) => void;
  onPreviewLesson: (lessonId: number) => void;
};

export function AdminLearningPathChapterBlock({
  ch,
  draftTitle,
  onDraftTitle,
  onSaveDelay,
  onTogglePublish,
  onAddLesson,
  onOpenLesson,
  onPreviewLesson,
}: Props) {
  const n = lessonCount(ch);
  return (
    <View style={styles.ch}>
      <Text style={styles.chTitle}>{ch.title_mn}</Text>
      <Text style={styles.meta}>
        JLPT N{6-ch.jlpt_level} · {n} хичээл · картанд орох хүлээлт (хоног)
      </Text>
      <TextInput
        style={styles.inp}
        defaultValue={String(ch.flashcard_delay_days)}
        keyboardType="number-pad"
        onSubmitEditing={(e) => onSaveDelay(e.nativeEvent.text)}
      />
      <Pressable style={styles.small} onPress={onTogglePublish}>
        <Text style={styles.smallTxt}>{ch.is_published ? 'Нууцлах' : 'Нийтлэх'}</Text>
      </Pressable>
      <TextInput
        style={styles.inp}
        placeholder="Шинэ хичээлийн гарчиг"
        value={draftTitle}
        onChangeText={onDraftTitle}
      />
      <Pressable style={styles.small} onPress={onAddLesson}>
        <Text style={styles.smallTxt}>Хичээл нэмэх</Text>
      </Pressable>
      {(ch.lessons ?? []).map((ls) => (
        <View key={ls.id} style={styles.lsRow}>
          <Pressable
            style={styles.lsMain}
            onPress={() => onOpenLesson(`/admin/lesson/${ls.id}` as Href)}
          >
            <Text style={styles.lsTitle}>{ls.title_mn}</Text>
            <Text style={styles.meta}>
              #{ls.id} · үг {ls.word_count} · {ls.is_published ? 'нийтлэгдсэн' : 'нуугдсан'}
            </Text>
          </Pressable>
          <Pressable style={styles.lsPreview} onPress={() => onPreviewLesson(ls.id)}>
            <Text style={styles.lsPreviewTxt}>{mn.admin.learningPathPreviewLesson}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
