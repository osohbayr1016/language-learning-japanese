import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type { ExamQuestion, ExamTemplate } from '../../lib/api/exams';

type Result = import('./MockExamResultsView').MockExamResultPayload | null;

export function useMockExamSession(
  token: string | null | undefined,
  initialTemplateId?: number | null
) {
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [sid, setSid] = useState<number | null>(null);
  const [qs, setQs] = useState<ExamQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<Record<number, string>>({});
  const [result, setResult] = useState<Result>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startFailed, setStartFailed] = useState(false);
  const [deeplinkInvalid, setDeeplinkInvalid] = useState(false);
  const autoStartOnce = useRef(false);
  const deeplinkTried = useRef(false);
  const t0 = useRef(Date.now());

  const selectable = useMemo(() => [...templates].sort((a, b) => a.jlpt_level - b.jlpt_level || a.id - b.id), [templates]);

  useEffect(() => {
    autoStartOnce.current = false;
    deeplinkTried.current = false;
    setDeeplinkInvalid(false);
  }, [token, initialTemplateId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!token) {
        setLoadingList(false);
        return;
      }
      try {
        const t = await api.exams.templates(token);
        if (!cancelled) setTemplates(t.data ?? []);
      } catch {
        if (!cancelled) setTemplates([]);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const sessionMetaBySid = useRef<Map<number, { max: number; durationMin: number }>>(new Map());

  const begin = useCallback(
    async (templateId: number) => {
      if (!token) return;
      setStarting(true);
      setStartFailed(false);
      try {
        const s = await api.exams.start(token, templateId);
        const sess = s.data.session_id;
        const mx = s.data.max_score;
        const dm = Math.max(1, Number(s.data.duration_minutes) || 55);
        sessionMetaBySid.current.set(sess, { max: mx > 0 ? mx : 180, durationMin: dm });
        setSid(sess);
        setQs(s.data.questions ?? []);
        setIdx(0);
        setAns({});
        setResult(null);
        t0.current = Date.now();
      } catch {
        setStartFailed(true);
        setQs([]);
      } finally {
        setStarting(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (loadingList || !token || sid !== null || starting || startFailed) return;

    const wantDeeplink = initialTemplateId != null && initialTemplateId > 0;
    if (wantDeeplink) {
      if (!deeplinkTried.current) {
        deeplinkTried.current = true;
        const ok = selectable.some((t) => t.id === initialTemplateId);
        if (ok) {
          if (!autoStartOnce.current) {
            autoStartOnce.current = true;
            void begin(initialTemplateId);
          }
        } else {
          setDeeplinkInvalid(true);
        }
      }
      return;
    }

    if (selectable.length !== 1) return;
    if (autoStartOnce.current) return;
    autoStartOnce.current = true;
    void begin(selectable[0]!.id);
  }, [loadingList, token, sid, starting, startFailed, selectable, begin, initialTemplateId]);

  const pick = (v: string) => {
    const cur = qs[idx];
    if (!cur) return;
    setAns((a) => ({ ...a, [cur.id]: v }));
  };

  const submitAll = async () => {
    if (!token || sid === null) return;
    const body = {
      answers: qs.map((q) => ({ question_id: q.id, answer: ans[q.id] ?? '' })),
      duration_seconds: Math.round((Date.now() - t0.current) / 1000),
    };
    const r = await api.exams.submit(token, sid, body);
    const meta = sessionMetaBySid.current.get(sid);
    sessionMetaBySid.current.delete(sid);
    const maxScore =
      meta?.max != null && meta.max > 0
        ? meta.max
        : r.data.max_score > 0
          ? r.data.max_score
          : 180;
    const d = r.data;
    const durationLimitMin = meta?.durationMin ?? 55;
    setResult({
      total: d.total_score,
      passed: d.passed,
      line: d.passing_score,
      max: maxScore,
      listeningScore: d.listening_score,
      readingScore: d.reading_score,
      knowledgeScore: d.knowledge_score??0,
      knowledgeCorrect:d.knowledge_correct??0,
      knowledgeTotal:d.knowledge_total??0,
      durationSeconds: typeof d.duration_seconds === 'number' ? d.duration_seconds : body.duration_seconds,
      durationLimitMin,
      listeningCorrect: d.listening_correct ?? 0,
      listeningTotal: d.listening_total ?? 0,
      readingCorrect: d.reading_correct ?? 0,
      readingTotal: d.reading_total ?? 0,
    });
  };

  return {
    templates,
    sid,
    qs,
    idx,
    setIdx,
    ans,
    result,
    loadingList,
    starting,
    startFailed,
    deeplinkInvalid,
    selectable,
    begin,
    pick,
    submitAll,
  };
}
