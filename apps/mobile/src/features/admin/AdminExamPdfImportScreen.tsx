import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { mn } from '../../i18n/mn';
import { colors } from '../../theme';
import { adminExamPdfImportStyles as styles } from './adminExamPdfImportStyles';
import { assetToPick } from './examImport/pickedAsset';
import { useMobileExamImportWizard } from './examImport/useMobileExamImportWizard';
import type { ExamDraftQuestion } from './examImport/examDraftTypes';

function draftPreviewStem(q: ExamDraftQuestion): string {
  const merged = [q.question_text, q.audio_text]
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ');
  if (!merged) return '—';
  return merged.length > 80 ? `${merged.slice(0, 80)}…` : merged;
}

function Btn({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, primary && styles.btnPri]} accessibilityRole="button">
      <Text style={[styles.btnTx, primary && styles.btnTxPri]}>{label}</Text>
    </Pressable>
  );
}

export function AdminExamPdfImportScreen() {
  const { token } = useAuth();
  const a = mn.admin;
  const w = useMobileExamImportWizard(token);

  const pickExam = useCallback(async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.[0]) w.setExamPick(assetToPick(r.assets[0]));
  }, [w]);

  const pickAns = useCallback(async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.[0]) w.setAnsPick(assetToPick(r.assets[0]));
  }, [w]);

  const pickWavs = useCallback(async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (!r.canceled && r.assets?.length) w.setWavPicks(r.assets.map(assetToPick));
  }, [w]);

  const importExam = async () => {
    const ok = await w.doImport();
    if (ok) Alert.alert(a.examPdfImportDoneTitle, a.examPdfImportDoneBody);
  };

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{a.examPdfImportNeedLogin}</Text>
      </View>
    );
  }

  const preview = w.drafts?.slice(0, 12) ?? [];
  const rest = (w.drafts?.length ?? 0) - preview.length;

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      {Platform.OS !== 'web' ? <Text style={styles.warn}>{a.examPdfImportWebPdfNote}</Text> : null}

      <Text style={styles.label}>{a.examPdfImportTitleField}</Text>
      <TextInput value={w.title} onChangeText={w.setTitle} style={styles.inp} />

      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>JLPT (1=N5 … 5=N1)</Text>
          <TextInput value={w.jlptBand} onChangeText={w.setJlptBand} keyboardType="number-pad" style={styles.inpSm} />
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>{a.examPdfImportDuration}</Text>
          <TextInput value={w.dur} onChangeText={w.setDur} keyboardType="number-pad" style={styles.inpSm} />
        </View>
      </View>

      <View style={styles.pubRow}>
        <Text style={styles.label}>{a.examPdfImportPublish}</Text>
        <Switch value={w.publish} onValueChange={w.setPublish} />
      </View>
      <Text style={styles.pubHint}>{a.examPdfImportPublishHint}</Text>

      <Pressable style={styles.pick} onPress={pickExam}>
        <Text style={styles.pickL}>{a.examPdfImportExamPdf}</Text>
        <Text style={styles.pickV} numberOfLines={1}>
          {w.examPick?.name ?? '…'}
        </Text>
      </Pressable>
      <Pressable style={styles.pick} onPress={pickAns}>
        <Text style={styles.pickL}>{a.examPdfImportAnswerPdf}</Text>
        <Text style={styles.pickV} numberOfLines={1}>
          {w.ansPick?.name ?? '…'}
        </Text>
      </Pressable>
      <Pressable style={styles.pick} onPress={pickWavs}>
        <Text style={styles.pickL}>{a.examPdfImportWavs(w.listenN)}</Text>
        <Text style={styles.pickV} numberOfLines={1}>
          {w.wavPicks.length ? `${w.wavPicks.length} файл` : '…'}
        </Text>
      </Pressable>

      <View style={styles.btns}>
        <Btn label={a.examPdfImportParse} onPress={() => void w.runParse()} primary />
        {w.drafts && w.wavPicks.length ? (
          <Btn label={a.examPdfImportReapplyWav} onPress={() => void w.reapplyWavs()} />
        ) : null}
      </View>

      {w.busy ? <ActivityIndicator color={colors.brand.primary} style={styles.spin} /> : null}
      {w.err ? <Text style={styles.err}>{w.err}</Text> : null}

      {w.drafts?.length ? (
        <View style={styles.draftBox}>
          <Text style={styles.draftTit}>{a.examPdfImportPreview}</Text>
          {preview.map((q, i) => (
            <Text key={`${q.order_num}-${i}`} style={styles.draftLn}>
              {q.order_num}. {q.section} · {draftPreviewStem(q)}
              <Text style={styles.draftKey}>
                {' '}
                · {a.examPdfImportAnswerKey}: {String(q.correct_answer).slice(0, 12)}
              </Text>
              {q.audio_key ? ' · ♪' : ''}
            </Text>
          ))}
          {rest > 0 ? <Text style={styles.more}>… +{rest}</Text> : null}
          <Btn label={a.examPdfImportSubmit} onPress={() => void importExam()} primary />
        </View>
      ) : null}
    </ScrollView>
  );
}
