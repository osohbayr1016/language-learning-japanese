import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { api } from '../../lib/api';
import type { LessonHtmlImportResult, LessonHtmlPreview } from '../../lib/api/admin';
import { useAuth } from '../../context/AuthContext';
import { adminNotify } from './adminNotify';
import { AdminLessonHtmlChapterPickSection } from './AdminLessonHtmlChapterPickSection';
import { useLessonHtmlImportChapters } from './useLessonHtmlImportChapters';
import { lessonHtmlImportStyles as styles } from './AdminLessonHtmlImportStyles';

function PreviewCard({ p }: { p: LessonHtmlPreview }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{p.title_cn || p.title_mn}</Text>
      <Text style={styles.hint}>{p.title_mn}</Text>
      <Text style={styles.stat}>ID: {p.external_lesson_id}</Text>
      <Text style={styles.stat}>Үг: {p.vocab_count} · Диалог: {p.dialogue_count}</Text>
      <Text style={styles.stat}>Grammar: {p.grammar_count} · Workbook: {p.workbook_count}</Text>
    </View>
  );
}

function ResultCard({ r, onOpen }: { r: LessonHtmlImportResult; onOpen: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Импорт дууслаа</Text>
      <Text style={styles.stat}>Lesson #{r.lesson_id}</Text>
      <Text style={styles.stat}>Шинэ үг: {r.inserted_words} · Давхардсан: {r.reused_words}</Text>
      <Text style={styles.stat}>Холбосон үг: {r.linked_words}</Text>
      <Pressable style={styles.btnSec} onPress={onOpen}>
        <Text style={styles.btnSecText}>Хичээл засах</Text>
      </Pressable>
    </View>
  );
}

export function AdminLessonHtmlImportScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [html, setHtml] = useState('');
  const [preview, setPreview] = useState<LessonHtmlPreview | null>(null);
  const [result, setResult] = useState<LessonHtmlImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    chapters,
    chapterId,
    setChapterId,
    creatingJlptBand,
    loadTree,
    ensureChapterForJlptBand,
  } = useLessonHtmlImportChapters(token ?? null);

  useEffect(() => {
    void loadTree().catch((e) => adminNotify('Алдаа', (e as Error).message));
  }, [loadTree]);

  const pickFile = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'text/html', copyToCacheDirectory: true });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (!asset?.uri) return;
      let text: string;
      if (Platform.OS === 'web') {
        const res = await fetch(asset.uri);
        if (!res.ok) throw new Error(`Файл унших боломжгүй (${res.status})`);
        text = await res.text();
      } else {
        text = await FileSystem.readAsStringAsync(asset.uri);
      }
      setHtml(text);
      setPreview(null);
      setResult(null);
    } catch (e) {
      adminNotify('Файл', e instanceof Error ? e.message : 'Уншихад алдаа');
    }
  };

  const runPreview = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const r = await api.admin.previewLessonHtml(token, html);
      setPreview(r.data);
      setResult(null);
    } catch (e) {
      adminNotify('Preview алдаа', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!token || !chapterId) return;
    setBusy(true);
    try {
      const r = await api.admin.importLessonHtml(token, { html, chapter_id: chapterId, is_published: true });
      setResult(r.data);
      adminNotify('Амжилттай', `Lesson #${r.data.lesson_id}`);
    } catch (e) {
      adminNotify('Import алдаа', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>HTML lesson import</Text>
        <Text style={styles.hint}>App-ready HTML файл сонгох эсвэл доор HTML-ээ paste хийнэ.</Text>
        <View style={styles.row}>
          <Pressable disabled={!token || busy} style={[styles.btnSec, busy && styles.btnDis]} onPress={() => void pickFile()}>
            <Text style={styles.btnSecText}>HTML файл сонгох</Text>
          </Pressable>
          <Pressable disabled={!token || busy || !html.trim()} style={[styles.btn, (!html.trim() || busy) && styles.btnDis]} onPress={() => void runPreview()}>
            <Text style={styles.btnText}>{busy ? '...' : 'Preview'}</Text>
          </Pressable>
        </View>
      </View>
      <AdminLessonHtmlChapterPickSection
        token={token ?? null}
        chapters={chapters}
        chapterId={chapterId}
        creatingJlptBand={creatingJlptBand}
        onSelectChapter={setChapterId}
        onCreateChapterForJlptBand={(band) => void ensureChapterForJlptBand(band)}
      />
      <TextInput style={styles.textarea} value={html} onChangeText={setHtml} multiline textAlignVertical="top" placeholder="HTML paste..." />
      {preview ? <PreviewCard p={preview} /> : null}
      {preview ? (
        <Pressable disabled={!chapterId || busy} style={[styles.btn, (!chapterId || busy) && styles.btnDis]} onPress={() => void runImport()}>
          <Text style={styles.btnText}>Апп руу импортлох</Text>
        </Pressable>
      ) : null}
      {result ? <ResultCard r={result} onOpen={() => router.push(`/admin/lesson/${result.lesson_id}` as Href)} /> : null}
    </ScrollView>
  );
}
