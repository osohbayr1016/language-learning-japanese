import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import { getItem, setItem } from '../lib/storage';

const DAILY_GOAL_KEY = 'daily_xp_goal';
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
  addLocalXp: (xp: number) => void;
};

const Ctx = createContext<GamCtx | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<Stats>(null);
  const [streak, setStreak] = useState<Streak>(null);
  const [dueToday, setDueToday] = useState(0);
  const [todayXp, setTodayXp] = useState(0);
  const [dailyGoal, setDailyGoalState] = useState<number>(DEFAULT_GOAL);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const d = await api.user.dashboard(token);
      setStats(d.data.stats);
      setStreak(d.data.streak);
      setDueToday(d.data.due_today ?? 0);
      setTodayXp(d.data.today_xp ?? 0);
    } catch (e) {
      console.warn('dashboard refresh failed', e);
    }
  }, [token]);

  useEffect(() => {
    void (async () => {
      const v = await getItem(DAILY_GOAL_KEY);
      if (v) setDailyGoalState(Number(v) || DEFAULT_GOAL);
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
      return;
    }
    setStats(null);
    setStreak(null);
    setDueToday(0);
    setTodayXp(0);
  }, [isAuthenticated, refresh]);

  const setDailyGoal = async (v: number) => {
    setDailyGoalState(v);
    await setItem(DAILY_GOAL_KEY, String(v));
  };

  const addLocalXp = (xp: number) => {
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
