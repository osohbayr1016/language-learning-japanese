import { useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { newSessionId } from '../lib/sessionIds';
import { rewardAccountFromToken } from '../lib/rewardOutbox';
import { rewardOutbox } from '../lib/rewardOutboxStorage';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import type { GameSessionBody } from '../lib/api/games';

export function useGameSession() {
  const { token } = useAuth();
  const { addLocalXp, refresh } = useGamification();
  const pending = useRef<{ key: string; owner: string; id: string; body: GameSessionBody } | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);

  const save = useCallback(
    async (body: GameSessionBody): Promise<boolean> => {
      // Anonymous play is allowed, but has no server-side XP.
      if (!token) return true;
      const owner = rewardAccountFromToken(token);
      if (!owner) return false;
      if (inflight.current) return inflight.current;
      const key = JSON.stringify(body);
      if (!pending.current || pending.current.key !== key || pending.current.owner !== owner) {
        pending.current = { key, owner, id: newSessionId(), body };
      }
      const session_id = pending.current.id;
      const saving = (async () => {
        try {
          const payload = { ...body, session_id };
          await rewardOutbox.put(owner, {
            kind: 'game', session_id, created_at: Date.now(), body: payload,
          });
          const response = await api.games.saveSession(token, payload);
          await rewardOutbox.remove(owner, 'game', session_id);
          if (pending.current?.id === session_id) pending.current = null;
          if (response.data.xp_earned > 0) addLocalXp(response.data.xp_earned, owner);
          void refresh();
          return true;
        } catch (e) {
          // A retry reuses the same session ID; never invent another XP award.
          console.warn('game session save failed; durable retry keeps session ID', e);
          return false;
        }
      })();
      inflight.current = saving;
      try { return await saving; } finally { inflight.current = null; }
    },
    [token, addLocalXp, refresh]
  );

  const retry = useCallback(async (): Promise<boolean> => {
    const owner = rewardAccountFromToken(token);
    return pending.current && pending.current.owner === owner ? save(pending.current.body) : false;
  }, [save, token]);

  return { save, retry };
}
