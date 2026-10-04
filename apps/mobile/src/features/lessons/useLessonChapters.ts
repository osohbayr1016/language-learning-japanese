import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Chapter } from '../../lib/types';

/** Сурах / нүүр — JLPT хичээлийн бүлгүүдийг API-аас татаж хадгална. */
export function useLessonChapters() {
  const { token } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** Нэвтэрсэн GET /api/lessons-оос; catalog fallback дээр null. */
  const [advanceGateOk, setAdvanceGateOk] = useState<boolean | null>(null);

  const retry = useCallback(() => setReloadKey((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      let next: Chapter[] | null = null;
      let gate: boolean | null = null;
      let authenticatedError: string | null = null;

      if (token) {
        try {
          const res = await api.lessons.list(token);
          next = res.data ?? [];
          if (typeof res.advance_gate_ok === 'boolean') gate = res.advance_gate_ok;
        } catch (e) {
          authenticatedError = e instanceof Error ? e.message : 'Хичээлийн явц татаж чадсангүй';
        }
      }

      // Only use the public catalog when authenticated loading failed. A real
      // authenticated empty curriculum must remain an empty state.
      if (next === null) {
        try {
          const pub = await api.lessons.catalog();
          next = pub.data ?? [];
          gate = null;
        } catch (e) {
          if (!cancelled) {
            setChapters([]);
            setAdvanceGateOk(null);
            setError(
              authenticatedError ??
                (e instanceof Error ? e.message : 'Хичээлийн жагсаалт татаж чадсангүй')
            );
            setLoading(false);
          }
          return;
        }
      }

      if (!cancelled) {
        setChapters(next);
        setAdvanceGateOk(gate);
        setError(null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  return { chapters, loading, error, retry, advanceGateOk };
}
