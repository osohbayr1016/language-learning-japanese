import React, { useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { parseKanjiImportLines, type ParsedImportLine } from './parseKanjiImportLines';
import type { AdminBulkValidateRow } from '../../lib/api/admin';
import { execAdminBulkCreate, execAdminBulkValidate } from './adminKanjiPasteBulkApi';

function alertUser(title: string, message?: string) {
  if (Platform.OS === 'web') {
    const g = globalThis as { alert?: (msg: string) => void };
    g.alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message ?? '');
}

function parseJlpt(raw: string) {
  return Math.min(5, Math.max(1, Number(raw) || 1));
}

export function useAdminBulkKanjiPaste(token: string | null | undefined, jlptLevel: string) {
  const [bulkText, setBulkText] = useState('');
  const [preview, setPreview] = useState<ParsedImportLine[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [validateBusy, setValidateBusy] = useState(false);
  const [textbookUnitBulk, setTextbookUnitBulk] = useState('');
  const [dupPolicy, setDupPolicy] = useState<'skip' | 'fail'>('skip');
  const [serverRows, setServerRows] = useState<AdminBulkValidateRow[] | null>(null);
  const [bulkExJp, setBulkExJp] = useState('');
  const [bulkExRo, setBulkExRo] = useState('');
  const [bulkExMn, setBulkExMn] = useState('');

  const okRows = useMemo(
    () => (preview ?? []).filter((p): p is Extract<ParsedImportLine, { ok: true }> => p.ok === true),
    [preview]
  );
  const errRows = useMemo(
    () => (preview ?? []).filter((p): p is Extract<ParsedImportLine, { ok: false }> => p.ok === false),
    [preview]
  );
  const serverFails = useMemo(
    () =>
      (serverRows ?? []).filter((r): r is Extract<AdminBulkValidateRow, { ok: false }> => !r.ok),
    [serverRows]
  );

  const exArg = { exampleJp: bulkExJp, exampleRomaji: bulkExRo, exampleMn: bulkExMn };

  const runParse = () => {
    const out = parseKanjiImportLines(bulkText);
    setPreview(out.length ? out : null);
    setServerRows(null);
    if (!out.length) alertUser('Задлах', 'Мөр олдсонгүй');
  };

  const runValidate = async () => {
    if (!token) return alertUser('Алдаа', 'Нэвтэрсэн байх шаардлагатай.');
    if (!preview?.length || !okRows.length) return alertUser('Алдаа', 'Эхлээд Задлах — зөв мөр байх ёстой');
    setValidateBusy(true);
    try {
      const { results, fails } = await execAdminBulkValidate({
        token,
        okRows,
        jlpt: parseJlpt(jlptLevel),
        textbookTrim: textbookUnitBulk.trim(),
        examples: exArg,
      });
      setServerRows(results);
      alertUser('Шалгалт', fails.length ? `Алдаа: ${fails.length}` : 'Зөв');
    } catch (e) {
      alertUser('Алдаа', (e as Error).message);
    } finally {
      setValidateBusy(false);
    }
  };

  const runBulk = async () => {
    if (!token) return alertUser('Алдаа', 'Нэвтэрсэн байх шаардлагатай.');
    if (!preview?.length || !okRows.length) return alertUser('Алдаа', 'Эхлээд Задлах — зөв мөр байх ёстой');
    setBusy(true);
    try {
      const res = await execAdminBulkCreate({
        token,
        okRows,
        jlpt: parseJlpt(jlptLevel),
        textbookTrim: textbookUnitBulk.trim(),
        dupPolicy,
        examples: exArg,
      });
      const r = res.data.results;
      const added = r.filter((x) => x.ok && !('skipped' in x && x.skipped)).length;
      const skipped = r.filter((x) => x.ok && 'skipped' in x && x.skipped).length;
      const failed = r.filter((x) => !x.ok).length;
      const sampleErr = r.find((x) => !x.ok) as { ok: false; kanji: string; error: string } | undefined;
      alertUser(
        'Дууссан',
        `Нэмэгдсэн: ${added}${skipped ? `\nАлгассан (давхар): ${skipped}` : ''}${failed ? `\nАлдаа: ${failed}${sampleErr ? `\nЖишээ: ${sampleErr.kanji} — ${sampleErr.error}` : ''}` : ''}`
      );
      setBulkText('');
      setPreview(null);
      setServerRows(null);
    } catch (e) {
      alertUser('Алдаа', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    bulkText,
    setBulkText,
    preview,
    busy,
    validateBusy,
    textbookUnitBulk,
    setTextbookUnitBulk,
    dupPolicy,
    setDupPolicy,
    okRows,
    errRows,
    serverFails,
    bulkExJp,
    setBulkExJp,
    bulkExRo,
    setBulkExRo,
    bulkExMn,
    setBulkExMn,
    runParse,
    runValidate,
    runBulk,
  };
}
