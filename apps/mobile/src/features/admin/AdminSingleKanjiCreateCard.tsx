import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
import { AdminKanjiCoreWordInputs } from './AdminKanjiCoreWordInputs';
import { AdminKanjiExampleFieldsBlock } from './AdminKanjiExampleFieldsBlock';
import { AdminSingleKanjiTailFields } from './AdminSingleKanjiTailFields';
import { examplePatchFromTriplet } from './exampleFieldsForAdminWord';

function alertUser(title: string, message?: string) {
  if (Platform.OS === 'web') {
    const g = globalThis as { alert?: (msg: string) => void };
    g.alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message ?? '');
}

type Props = { jlpt: string; onJlptChange: (s: string) => void; onCreated?: (id: number) => void };

export function AdminSingleKanjiCreateCard({ jlpt, onJlptChange, onCreated }: Props) {
  const { token } = useAuth();
  const [kanji, setKanji] = useState('');
  const [romaji, setRomaji] = useState('');
  const [meaningMn, setMeaningMn] = useState('');
  const [textbookUnit, setTextbookUnit] = useState('');
  const [rejectDup, setRejectDup] = useState(false);
  const [exampleJp, setExampleJp] = useState('');
  const [exampleRo, setExampleRo] = useState('');
  const [exampleMn, setExampleMn] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token) return alertUser('Алдаа', 'Нэвтэрсэн байх шаардлагатай.');
    const kj = kanji.trim();
    if (!kj) return alertUser('Алдаа', 'Канжи эсвэл кана оруулна уу');
    setLoading(true);
    try {
      const ex = examplePatchFromTriplet({
        exampleJp,
        exampleRomaji: exampleRo,
        exampleMn,
      });
      const jl = Math.min(5, Math.max(1, Number(jlpt) || 1));
      const res = await api.admin.createWord(token, {
        kanji: kj,
        romaji: romaji.trim(),
        romaji_numbered: romaji.trim(),
        meaning_mn: meaningMn.trim(),
        jlpt_level: jl,
        textbook_unit: textbookUnit.trim() || undefined,
        reject_duplicate: rejectDup,
        ...ex,
      });
      alertUser('Боллоо', `Үгийн id: ${res.data.id}`);
      setKanji('');
      setRomaji('');
      setMeaningMn('');
      setExampleJp('');
      setExampleRo('');
      setExampleMn('');

      if (onCreated) {
        onCreated(res.data.id);
      }
    } catch (e) {
      alertUser('Алдаа', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.block}>
      <AdminKanjiCoreWordInputs
        kanji={kanji}
        romaji={romaji}
        meaningMn={meaningMn}
        onKanji={setKanji}
        onRomaji={setRomaji}
        onMeaningMn={setMeaningMn}
      />
      <AdminKanjiExampleFieldsBlock
        exampleJp={exampleJp}
        exampleRomaji={exampleRo}
        exampleMn={exampleMn}
        onExampleJp={setExampleJp}
        onExampleRomaji={setExampleRo}
        onExampleMn={setExampleMn}
        disabled={!token}
      />
      <AdminSingleKanjiTailFields
        jlpt={jlpt}
        onJlptChange={onJlptChange}
        textbookUnit={textbookUnit}
        onTextbookUnit={setTextbookUnit}
        rejectDup={rejectDup}
        onRejectDup={setRejectDup}
      />
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() => void submit()}
        style={({ pressed }) => [
          styles.btn,
          loading && styles.btnDis,
          Platform.OS === 'web' && styles.btnWeb,
          pressed && Platform.OS !== 'web' && styles.btnPressed,
        ]}
      >
        <Text style={styles.btnTxt}>{loading ? 'Илгээж байна…' : 'Нэмэх'}</Text>
      </Pressable>
      <Text style={styles.hint}>
        Олон тэмдэгттэй үед зураасны дата тэмдэг бүрээр ажиллана. Дата байхгүй бол түр зогсоно.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { flex: 1 },
  btn: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnWeb: { cursor: 'pointer' as const },
  btnPressed: { opacity: 0.92 },
  btnDis: { opacity: 0.6 },
  btnTxt: { ...typography.body.md, color: '#fff', fontWeight: '700' },
  hint: { ...typography.body.sm, color: colors.text.muted, marginTop: spacing.md },
});
