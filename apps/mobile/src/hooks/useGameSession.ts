import { useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { newSessionId } from '../lib/sessionIds';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import type { GameSessionBody } from '../lib/api/games';

export function useGameSession() {
  const { token } = useAuth();
  const { addLocalXp, refresh } = useGamification();
  const pending = useRef<{ key: string; id: string; body: GameSessionBody } | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);

  const save = useCallback(
    async (body: GameSessionBody): Promise<boolean> => {
      // Anonymous play is allowed, but has no server-side XP.
      if (!token) return true;
      if (inflight.current) return inflight.current;
      const key = JSON.stringify(body);
      if (!pending.current || pending.current.key !== key) {
        pending.current = { key, id: newSessionId(), body };
      }
      const session_id = pending.current.id;
      const saving = (async () => {
        try {
          const response = await api.games.saveSession(token, { ...body, session_id });
          if (pending.current?.id === session_id) pending.current = null;
          if (response.data.xp_earned > 0) addLocalXp(response.data.xp_earned);
          void refresh();
          return true;
        } catch (e) {
          // A retry reuses the same session ID; never invent another XP award.
          console.warn('game session save failed; retry keeps session ID', e);
          return false;
        }
      })();
      inflight.current = saving;
      try { return await saving; } finally { inflight.current = null; }
    },
    [token, addLocalXp, refresh]
  );

  const retry = useCallback(async (): Promise<boolean> => {
    return pending.current ? save(pending.current.body) : false;
  }, [save]);

  return { save, retry };
}
