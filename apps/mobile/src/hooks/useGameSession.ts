import { useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { newSessionId } from '../lib/sessionIds';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import type { GameSessionBody } from '../lib/api/games';

export function useGameSession() {
  const { token } = useAuth();
  const { addLocalXp, refresh } = useGamification();
  const pending = useRef<{ key: string; id: string } | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const save = useCallback(
    async (body: GameSessionBody) => {
      if (!token) return;
      if (inflight.current) return inflight.current;
      const key = JSON.stringify(body);
      if (!pending.current || pending.current.key !== key) {
        pending.current = { key, id: newSessionId() };
      }
      const session_id = pending.current.id;
      const saving = (async () => {
        try {
          const response = await api.games.saveSession(token, { ...body, session_id });
          if (pending.current?.id === session_id) pending.current = null;
          if (response.data.xp_earned > 0) addLocalXp(response.data.xp_earned);
          void refresh();
        } catch (e) {
          // A retry reuses the same session ID; never invent another XP award.
          console.warn('game session save failed; retry keeps session ID', e);
        }
      })();
      inflight.current = saving;
      try { await saving; } finally { inflight.current = null; }
    },
    [token, addLocalXp, refresh]
  );

  return { save };
}
