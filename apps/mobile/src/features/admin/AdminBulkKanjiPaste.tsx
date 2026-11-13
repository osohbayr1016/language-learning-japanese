import React from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { bulkKanjiStyles as styles } from './AdminBulkKanjiPaste.styles';
import { AdminBulkKanjiPasteTools } from './AdminBulkKanjiPasteTools';
import { AdminBulkParsedSection } from './AdminBulkParsedSection';
import { useAdminBulkKanjiPaste } from './useAdminBulkKanjiPaste';

type Props = { token: string | null | undefined; jlptLevel: string };

export function AdminBulkKanjiPaste({ token, jlptLevel }: Props) {
  const p = useAdminBulkKanjiPaste(token, jlptLevel);

  return (
    <View style={styles.block}>
      <Text style={styles.sectionTitle}>Олон мөр (канжи/кана + romaji + ### + утга)</Text>
      <Text style={styles.hintTiny}>
        Жишээ: こんにちは konnichiwa ### Сайн байна уу{'\n'}
        Олон үгтэй: がくせい gakusei ### оюутан
      </Text>
      <AdminBulkKanjiPasteTools
        token={Boolean(token)}
        textbookUnit={p.textbookUnitBulk}
        onTextbookUnit={p.setTextbookUnitBulk}
        dupPolicy={p.dupPolicy}
        onDupPolicy={p.setDupPolicy}
        onValidate={() => void p.runValidate()}
        validateBusy={p.validateBusy}
        canValidate={p.okRows.length > 0 && Boolean(p.preview)}
      />
      <TextInput
        style={styles.textarea}
        value={p.bulkText}
        onChangeText={p.setBulkText}
        multiline
        textAlignVertical="top"
        placeholder="Мөр бүр ..."
        editable={!!token}
      />
      <Pressable
        accessibilityRole="button"
        disabled={!token || p.busy}
        style={({ pressed }) => [styles.btnSec, pressed && Platform.OS !== 'web' && { opacity: 0.92 }]}
        onPress={p.runParse}
      >
        <Text style={styles.btnSecTx}>Задлах</Text>
      </Pressable>
      {p.preview && p.preview.length > 0 ? (
        <AdminBulkParsedSection
          preview={p.preview}
          okRows={p.okRows}
          errRows={p.errRows}
          serverFails={p.serverFails}
          token={Boolean(token)}
          bulkExJp={p.bulkExJp}
          bulkExRo={p.bulkExRo}
          bulkExMn={p.bulkExMn}
          onBulkExJp={p.setBulkExJp}
          onBulkExRo={p.setBulkExRo}
          onBulkExMn={p.setBulkExMn}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={!token || p.busy || p.okRows.length === 0}
        style={({ pressed }) => [
          styles.btn,
          (!token || p.okRows.length === 0 || p.busy) && styles.btnDis,
          pressed && Platform.OS !== 'web' && styles.btnPressed,
          Platform.OS === 'web' && styles.btnWeb,
        ]}
        onPress={() => void p.runBulk()}
      >
        <Text style={styles.btnTxt}>{p.busy ? 'Илгээж байна…' : 'Бүгдийг нэмэх'}</Text>
      </Pressable>
    </View>
  );
}
