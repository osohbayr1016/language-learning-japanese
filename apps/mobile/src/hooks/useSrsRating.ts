import { useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import { calculateAdaptive, type AdaptiveInputs, type AdaptiveProgressInput } from '../lib/srs/adaptive';
import type { ProgressResult } from '../lib/api/user';

type SessionType = 'flashcard' | 'learn' | 'write' | 'writer';

type Buffer = ProgressResult & { rating: number };

export function useSrsRating(sessionType: SessionType) {
  const { token } = useAuth();
  const { addLocalXp, refresh } = useGamification();
  const buffer = useRef<Buffer[]>([]);
  const submissionId = useRef<string | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);

  const record = useCallback(
    (
      wordId: number,
      progress: AdaptiveProgressInput | null,
      inputs: AdaptiveInputs
    ) => {
      const r = calculateAdaptive(progress, inputs);
      const item: Buffer = {
        word_id: wordId,
        rating: r.adjusted_rating,
        ease_factor: r.ease_factor,
        interval: r.interval,
        repetitions: r.repetitions,
        next_review: r.next_review.toISOString(),
        response_ms: r.response_ms,
        confidence: r.confidence,
      };
      if (!submissionId.current) submissionId.current = crypto.randomUUID();
      buffer.current.push(item);
      return r;
    },
    []
  );

  const flush = useCallback(
    async (xp: number): Promise<boolean> => {
      if (!token) return false;
      if (!buffer.current.length) return true;
      if (inflight.current) return inflight.current;
      const results = buffer.current.map(({ rating: _r, ...rest }) => rest);
      const session_id = submissionId.current ?? crypto.randomUUID();
      submissionId.current = session_id;
      const saving = (async () => {
        try {
          const response = await api.user.saveProgress(token, {
            session_id,
            results,
            xp_earned: xp,
            session_type: sessionType,
          });
          buffer.current = [];
          submissionId.current = null;
          if (response.data.xp_earned > 0) addLocalXp(response.data.xp_earned);
          void refresh();
          return true;
        } catch (e) {
          // Keep exact evidence and stable session ID for a safe retry.
          console.warn('saveProgress failed, pending evidence retained', e);
          return false;
        }
      })();
      inflight.current = saving;
      try { return await saving; } finally { inflight.current = null; }
    },
    [token, sessionType, addLocalXp, refresh]
  );

  const reset = useCallback(() => { buffer.current = []; submissionId.current = null; }, []);

  return { record, flush, reset, count: () => buffer.current.length };
}
