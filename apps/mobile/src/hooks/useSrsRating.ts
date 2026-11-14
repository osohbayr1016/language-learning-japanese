import { useCallback, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { newSessionId } from '../lib/sessionIds';
import { rewardAccountFromToken } from '../lib/rewardOutbox';
import { rewardOutbox } from '../lib/rewardOutboxStorage';
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
  const owner = rewardAccountFromToken(token);
  const ownerRef = useRef(owner);
  useEffect(() => {
    if (ownerRef.current === owner) return;
    // Account switches must never award the prior learner's in-memory ratings
    // to the newly signed-in user. Completed prior sessions remain in outbox.
    ownerRef.current = owner;
    buffer.current = [];
    submissionId.current = null;
  }, [owner]);

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
      if (!submissionId.current) submissionId.current = newSessionId();
      // A retried final rating must not send the same word twice in one batch.
      buffer.current = buffer.current.filter((row) => row.word_id !== wordId);
      buffer.current.push(item);
      return r;
    },
    []
  );

  const flush = useCallback(
    async (xp: number): Promise<boolean> => {
      if (!token) return false;
      const owner = rewardAccountFromToken(token);
      if (!owner) return false;
      if (!buffer.current.length) return true;
      if (inflight.current) return inflight.current;
      const results = buffer.current.map(({ rating: _r, ...rest }) => rest);
      const session_id = submissionId.current ?? newSessionId();
      submissionId.current = session_id;
      const saving = (async () => {
        const body = { session_id, results, xp_earned: xp, session_type: sessionType };
        try {
          // Commit before uploading. Closing the app after a network failure does
          // not lose the evidence or generate another award receipt.
          await rewardOutbox.put(owner, {
            kind: 'study', session_id, created_at: Date.now(), body,
          });
          const response = await api.user.saveProgress(token, body);
          await rewardOutbox.remove(owner, 'study', session_id);
          buffer.current = [];
          submissionId.current = null;
          if (response.data.xp_earned > 0) addLocalXp(response.data.xp_earned, owner);
          void refresh();
          return true;
        } catch (e) {
          console.warn('saveProgress failed; session remains available for sync', e);
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
