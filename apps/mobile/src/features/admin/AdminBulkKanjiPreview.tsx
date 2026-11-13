import React from 'react';
import { Text, View } from 'react-native';
import { bulkKanjiStyles as styles } from './AdminBulkKanjiPaste.styles';
import type { AdminBulkValidateRow } from '../../lib/api/admin';
import type { ParsedImportLine } from './parseKanjiImportLines';
import { mn } from '../../i18n/mn';

type SharedEx = { jp: string; ro: string; mn: string };

type Props = {
  preview: ParsedImportLine[];
  okRows: Extract<ParsedImportLine, { ok: true }>[];
  errRows: Extract<ParsedImportLine, { ok: false }>[];
  serverFails: Extract<AdminBulkValidateRow, { ok: false }>[];
  sharedExample?: SharedEx | null;
};

export function AdminBulkKanjiPreview(props: Props) {
  const { preview, okRows, errRows, serverFails, sharedExample } = props;
  if (!preview.length) return null;

  const showEx = Boolean(
    sharedExample?.jp?.trim() || sharedExample?.ro?.trim() || sharedExample?.mn?.trim()
  );

  return (
    <View style={styles.previewBox}>
      <Text style={styles.previewMeta}>
        Зөв: {okRows.length} · Алдаа: {errRows.length}
        {serverFails.length ? ` · Сервер: ${serverFails.length}` : ''}
      </Text>
      {serverFails.length ? (
        <Text style={styles.errMore}>{mn.admin.bulkServerValidateMerged}</Text>
      ) : null}
      {serverFails.slice(0, 6).map((er, i) => (
        <Text key={`s-${i}`} style={styles.errLine}>
          Kanji stroke data: {er.kanji} — {er.error}
        </Text>
      ))}
      {serverFails.length > 6 ? (
        <Text style={styles.errMore}>… +{serverFails.length - 6} мөр</Text>
      ) : null}
      {errRows.slice(0, 8).map((er, i) => (
        <Text key={`e-${i}`} style={styles.errLine}>
          {er.reason}: {er.line.slice(0, 60)}
          {er.line.length > 60 ? '…' : ''}
        </Text>
      ))}
      {errRows.length > 8 ? (
        <Text style={styles.errMore}>… +{errRows.length - 8} мөр</Text>
      ) : null}
      {okRows.slice(0, 5).map((r, i) => (
        <View key={`o-${i}`} style={{ marginBottom: 4 }}>
          <Text style={styles.okLine}>
            {r.kanji} · {r.romaji}
          </Text>
          <Text style={styles.okMean}>Монгол: {r.meaning_mn}</Text>
        </View>
      ))}
      {okRows.length > 5 ? (
        <Text style={styles.errMore}>… +{okRows.length - 5} үг</Text>
      ) : null}
      {showEx ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.previewMeta}>{mn.admin.wordExamplePreviewTitle}</Text>
          {sharedExample?.jp?.trim() ? (
            <Text style={styles.okSharedEx}>
              {mn.admin.wordExampleJp}: {sharedExample.jp.trim()}
            </Text>
          ) : null}
          {sharedExample?.ro?.trim() ? (
            <Text style={styles.okSharedEx}>
              {mn.admin.wordExampleRomaji}: {sharedExample.ro.trim()}
            </Text>
          ) : null}
          {sharedExample?.mn?.trim() ? (
            <Text style={styles.okSharedEx}>
              {mn.admin.wordExampleMn}: {sharedExample.mn.trim()}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
