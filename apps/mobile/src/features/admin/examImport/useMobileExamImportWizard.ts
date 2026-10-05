import { useCallback, useState } from 'react';
import { buildManchesterHsk2Draft } from './buildManchesterHsk2Draft';
import type { ExamDraftQuestion } from './examDraftTypes';
import type { PickedDoc } from './pickedAsset';
import { readPickBuffer } from './readPickBuffer';
import { uploadListeningPicksToDrafts } from './uploadListeningPicks';
import { examImportAdmin } from '../../../lib/api/examImportAdmin';

export function useMobileExamImportWizard(token: string | null | undefined) {
  const [title, setTitle] = useState('JLPT PDF импорт');
  const [jlptBand, setJlptBand] = useState('1');
  const [dur, setDur] = useState('55');
  const [publish, setPublish] = useState(true);
  const [examPick, setExamPick] = useState<PickedDoc | null>(null);
  const [ansPick, setAnsPick] = useState<PickedDoc | null>(null);
  const [wavPicks, setWavPicks] = useState<PickedDoc[]>([]);
  const [drafts, setDrafts] = useState<ExamDraftQuestion[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const listenN = drafts?.filter((d) => d.section === 'listening').length ?? 0;

  const runParse = async () => {
    if (!token) return;
    if (!examPick || !ansPick) {
      setErr('Шалгалт болон хариултын PDF сонгоно уу.');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      const { extractPdfText } = await import('./extractPdfText');
      const [eb, ab] = await Promise.all([readPickBuffer(examPick), readPickBuffer(ansPick)]);
      const [examTx, ansTx] = await Promise.all([extractPdfText(eb), extractPdfText(ab)]);
      let next = buildManchesterHsk2Draft(examTx, ansTx);
      if (wavPicks.length) next = await uploadListeningPicksToDrafts(token, next, wavPicks);
      setDrafts(next);
    } catch (e) {
      setDrafts(null);
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reapplyWavs = async () => {
    if (!token || !drafts?.length || !wavPicks.length) return;
    setBusy(true);
    setErr('');
    try {
      setDrafts(await uploadListeningPicksToDrafts(token, drafts, wavPicks));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onPatch = useCallback((index: number, patch: Partial<ExamDraftQuestion>) => {
    setDrafts((prev) => {
      if (!prev) return prev;
      const n = [...prev];
      n[index] = { ...n[index]!, ...patch };
      return n;
    });
  }, []);

  const doImport = async (): Promise<boolean> => {
    if (!token || !drafts?.length) return false;
    setBusy(true);
    setErr('');
    try {
      const band = Math.min(5, Math.max(1, Number(jlptBand) || 1));
      const dMin = Math.max(1, Number(dur) || 55);
      await examImportAdmin.importExam(token, {
        title: title.trim() || `JLPT импорт ${new Date().toISOString().slice(0, 10)}`,
        jlpt_level: band,
        duration_minutes: dMin,
        max_score: 200,
        passing_score: 120,
        is_published: publish,
        questions: drafts.map((q) => ({
          section: q.section,
          part_num: q.part_num,
          question_num: q.question_num,
          audio_text: q.audio_text ?? '',
          question_text: q.question_text ?? '',
          question_pinyin: q.question_pinyin ?? '',
          options: q.options,
          correct_answer: q.correct_answer,
          order_num: q.order_num,
          audio_key: q.audio_key ?? null,
        })),
      });
      setDrafts(null);
      setExamPick(null);
      setAnsPick(null);
      setWavPicks([]);
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    title,
    setTitle,
    jlptBand,
    setJlptBand,
    dur,
    setDur,
    publish,
    setPublish,
    examPick,
    setExamPick,
    ansPick,
    setAnsPick,
    wavPicks,
    setWavPicks,
    drafts,
    err,
    busy,
    listenN,
    runParse,
    reapplyWavs,
    onPatch,
    doImport,
  };
}
