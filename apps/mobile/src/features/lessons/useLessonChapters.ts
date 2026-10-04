import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Chapter } from '../../lib/types';

/** Сурах / нүүр — JLPT хичээлийн бүлгүүдийг API-аас татаж хадгална. */
export function useLessonChapters() {
  const { token } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  /** Нэвтэрсэн GET /api/lessons-оос; catalog fallback дээр null. */
  const [advanceGateOk, setAdvanceGateOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        let next: Chapter[] = [];
        let gate: boolean | null = null;
        if (token) {
          try {
            const res = await api.lessons.list(token);
            next = res.data ?? [];
            if (typeof res.advance_gate_ok === 'boolean') gate = res.advance_gate_ok;
          } catch {
            next = [];
          }
        }
        if (!cancelled && next.length === 0) {
          try {
            const pub = await api.lessons.catalog();
            next = pub.data ?? [];
            gate = null;
          } catch {
            next = [];
          }
        }
        if (!cancelled) {
          setChapters(next);
          setAdvanceGateOk(gate);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { chapters, loading, advanceGateOk };
}
