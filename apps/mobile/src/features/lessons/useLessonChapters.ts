import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Chapter } from '../../lib/types';

export type LessonCatalogSource = 'authenticated' | 'public' | 'none';

/**
 * JLPT lesson tree loader.
 *
 * An authenticated failure may still fall back to the public catalog so the
 * learner can keep reading, but that degraded state is surfaced to the UI.
 * We never turn a request failure into a normal-looking empty curriculum.
 */
export function useLessonChapters() {
  const { token } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [advanceGateOk, setAdvanceGateOk] = useState<boolean | null>(null);
  const [source, setSource] = useState<LessonCatalogSource>('none');
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const retry = useCallback(() => setRevision((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      let next: Chapter[] = [];
      let gate: boolean | null = null;
      let nextSource: LessonCatalogSource = 'none';
      let authenticatedError: string | null = null;

      if (token) {
        try {
          const res = await api.lessons.list(token);
          next = res.data ?? [];
          gate = typeof res.advance_gate_ok === 'boolean' ? res.advance_gate_ok : null;
          nextSource = 'authenticated';
        } catch (e) {
          authenticatedError =
            e instanceof Error ? e.message : 'Нэвтэрсэн хичээлийн явцыг ачаалж чадсангүй';
        }
      }

      // Public fallback is useful for reading, but it is explicitly degraded:
      // it has no personal completion state and cannot prove unlock status.
      if (nextSource === 'none') {
        try {
          const pub = await api.lessons.catalog();
          next = pub.data ?? [];
          gate = null;
          nextSource = 'public';
        } catch (e) {
          const publicError = e instanceof Error ? e.message : 'Хичээлийн жагсаалтыг ачаалж чадсангүй';
          if (!cancelled) {
            setChapters([]);
            setAdvanceGateOk(null);
            setSource('none');
            setError(authenticatedError ? `${authenticatedError}. ${publicError}` : publicError);
            setLoading(false);
          }
          return;
        }
      }

      if (!cancelled) {
        setChapters(next);
        setAdvanceGateOk(gate);
        setSource(nextSource);
        setError(authenticatedError);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, revision]);

  return {
    chapters,
    loading,
    advanceGateOk,
    source,
    error,
    degraded: source === 'public' && Boolean(token),
    retry,
  };
}
