import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import { getItem, setItem } from '../lib/storage';
import { rewardAccountFromToken } from '../lib/rewardOutbox';
import { dailyGoalCacheKey, isCurrentAccountResult } from '../lib/auth/accountState';

const DEFAULT_GOAL = 30;

import type { Stats, Streak } from '../lib/api/user';

type GamCtx = {
  stats: Stats;
  streak: Streak;
  dueToday: number;
  todayXp: number;
  dailyGoal: number;
  setDailyGoal: (v: number) => Promise<void>;
  refresh: () => Promise<void>;
  addLocalXp: (xp: number, awardedToAccount?: string) => void;
};

const Ctx = createContext<GamCtx | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const tokenRef = useRef(token);
  const refreshTicket = useRef(0);
  tokenRef.current = token;
  const [stats, setStats] = useState<Stats>(null);
  const [streak, setStreak] = useState<Streak>(null);
  const [dueToday, setDueToday] = useState(0);
  const [todayXp, setTodayXp] = useState(0);
  const [dailyGoal, setDailyGoalState] = useState<number>(DEFAULT_GOAL);

  const refresh = useCallback(async () => {
    if (!token) return;
    const ticket = ++refreshTicket.current;
    try {
      const d = await api.user.dashboard(token);
      if (!isCurrentAccountResult(token, tokenRef.current, ticket, refreshTicket.current)) return;
      setStats(d.data.stats);
      setStreak(d.data.streak);
      setDueToday(d.data.due_today ?? 0);
      setTodayXp(d.data.today_xp ?? 0);
      const serverGoal = Number(d.data.daily_xp_goal ?? 0);
      if (serverGoal >= 10 && serverGoal <= 200) {
        setDailyGoalState(serverGoal);
        await setItem(dailyGoalCacheKey(token), String(serverGoal));
      }
    } catch (e) {
      console.warn('dashboard refresh failed', e);
    }
  }, [token]);

  useEffect(() => {
    // Reset the previous learner's achievements immediately on an auth switch.
    ++refreshTicket.current;
    setStats(null);
    setStreak(null);
    setDueToday(0);
    setTodayXp(0);
    setDailyGoalState(DEFAULT_GOAL);
    let active = true;
    void (async () => {
      const value = await getItem(dailyGoalCacheKey(token));
      if (!active || tokenRef.current !== token) return;
      const parsed = Number(value);
      if (value !== null && Number.isInteger(parsed) && parsed >= 10 && parsed <= 200)
        setDailyGoalState(parsed);
      // Server preferences are authoritative over the local per-user cache.
      if (token) await refresh();
    })();
    return () => { active = false; ++refreshTicket.current; };
  }, [token, refresh]);

  const setDailyGoal = async (v: number) => {
    const safe = Math.max(10, Math.min(200, Math.round(v)));
    setDailyGoalState(safe);
    await setItem(dailyGoalCacheKey(token), String(safe));
    if (token) {
      try {
        await api.user.updatePreferences(token, { daily_xp_goal: safe });
      } catch (e) {
        console.warn('daily goal sync failed', e);
      }
    }
  };

  const addLocalXp = (xp: number, awardedToAccount?: string) => {
    if (awardedToAccount && awardedToAccount !== rewardAccountFromToken(tokenRef.current)) return;
    const safeXp = Math.max(0, Math.floor(xp));
    if (safeXp === 0) return;
    setStats((s) => (s ? { ...s, total_xp: s.total_xp + safeXp } : s));
    setTodayXp((current) => current + safeXp);
  };

  return (
    <Ctx.Provider value={{ stats, streak, dueToday, todayXp, dailyGoal, setDailyGoal, refresh, addLocalXp }}>
      {children}
    </Ctx.Provider>
  );
}

export function useGamification() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGamification must be used within GamificationProvider');
  return c;
}
