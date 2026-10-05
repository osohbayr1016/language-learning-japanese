import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { cartoonsAdmin } from '../../lib/api/cartoonsAdmin';
import { adminNotify } from './adminNotify';
import { colors, spacing, typography } from '../../theme';

type Props = {
  token: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onCreated: (id: number) => void;
};

export function CartoonAdminCreateSection({ token, busy, setBusy, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [jlptBand, setJlptBand] = useState('1');
  const [duration, setDuration] = useState('60');
  const [status, setStatus] = useState('');

  const submit = async () => {
    const t = title.trim();
    if (!t) {
      adminNotify('Алдаа', 'Гарчиг оруулна уу');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      setStatus('Видео…');
      const v = await cartoonsAdmin.uploadWithPicker(token, 'video');
      let thumbKey: string | undefined;
      try {
        setStatus('Зураг…');
        const th = await cartoonsAdmin.uploadWithPicker(token, 'thumbnail');
        thumbKey = th.key;
      } catch {
        thumbKey = undefined;
      }

      const band = Math.min(5, Math.max(1, Number(jlptBand) || 1));
      setStatus('Хадгалж байна…');
      const c = await cartoonsAdmin.create(token, {
        title_mn: t,
        description_mn: desc.trim(),
        video_key: v.key,
        thumbnail_key: thumbKey,
        jlpt_level: band,
        duration_s: Number(duration) || 0,
        is_published: true,
      });
      setStatus('');
      setTitle('');
      setDesc('');
      adminNotify('Боллоо', `ID: ${c.data.id}`);
      onCreated(c.data.id);
    } catch (e) {
      const msg = (e as Error).message;
      setStatus(msg.startsWith('Цуцлагдсан') ? '' : msg);
      if (!msg.startsWith('Цуцлагдсан')) adminNotify('Алдаа', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.pad}>
        <Text style={styles.h}>Шинэ хүүхэлдэй</Text>
        <Text style={styles.lbl}>Гарчиг</Text>
        <TextInput style={styles.inp} value={title} onChangeText={setTitle} />
        <Text style={styles.lbl}>Тайлбар</Text>
        <TextInput style={[styles.inp, styles.ta]} value={desc} onChangeText={setDesc} multiline />
        <Text style={styles.lbl}>JLPT түвшин (1=N5, 2=N4, 3=N3, 4=N2, 5=N1)</Text>
        <TextInput style={styles.inp} value={jlptBand} onChangeText={setJlptBand} keyboardType="number-pad" />
        <Text style={styles.lbl}>Үргэлжлэх (сек)</Text>
        <TextInput style={styles.inp} value={duration} onChangeText={setDuration} keyboardType="number-pad" />
        <Text style={styles.hint}>Эхлээд видео, дараа нь thumbnail сонгоно.</Text>
        {status ? <Text style={styles.stat}>{status}</Text> : null}
        <Pressable style={styles.btn} disabled={busy} onPress={() => void submit()}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnTxt}>Файл сонгоод үүсгэх</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.md, paddingBottom: spacing.xxl },
  h: { ...typography.heading.md, color: colors.text.primary, marginBottom: spacing.sm },
  lbl: { ...typography.body.sm, color: colors.text.secondary, marginBottom: 4 },
  inp: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.text.primary,
    backgroundColor: colors.bg.card,
  },
  ta: { minHeight: 72, textAlignVertical: 'top' },
  hint: { ...typography.body.sm, color: colors.text.muted, marginBottom: spacing.sm },
  stat: { ...typography.body.sm, color: colors.text.secondary, marginBottom: spacing.sm },
  btn: {
    padding: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '700' },
});
