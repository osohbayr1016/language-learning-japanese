import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getItem, removeItem, setItem } from '../lib/storage';
import { restoreStoredAccessToken } from '../lib/auth/restoreStoredAccessToken';
import { syncAdminFromServer } from '../lib/auth/syncAdminFromServer';
import { refreshStoredAdminFlag } from '../lib/auth/refreshStoredAdminFlag';
import { persistSession } from '../lib/auth/persistSession';
import {
  subscribeAccessTokenRefreshed,
  subscribeSessionCleared,
} from '../lib/auth/authEvents';
import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
} from '../lib/auth/tokenStorageKeys';
import type { JlptSelfLevel, LearningReason } from '../features/setup/types';

function migrateStoredLevel(raw: string | null): JlptSelfLevel | null {
  if (raw == null || raw === '') return null;
  const map: Record<string, JlptSelfLevel> = {
    none: 'none',
    n5: 'n5',
    n4: 'n4',
    n3: 'n3',
    n2: 'n2',
    n1: 'n1',
    hsk1: 'n5',
    hsk2: 'n4',
    hsk3: 'n3',
    hsk4: 'n2',
    hsk5: 'n1',
    hsk6: 'n1',
  };
  return map[raw] ?? null;
}

const ONBOARDING_KEY = 'has_seen_onboarding';
const LEVEL_KEY = 'jlpt_self_level';
const LEGACY_LEVEL_KEY = 'chinese_level';
const REASON_KEY = 'learning_reason';

interface AuthState {
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  jlptLevel: JlptSelfLevel | null;
  /** @deprecated compatibility alias; new code must use jlptLevel. */
  chineseLevel: JlptSelfLevel | null;
  reason: LearningReason | null;
}

interface AuthContextType extends AuthState {
  signIn: (tokens: { access_token: string; refresh_token: string }) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  saveSetup: (level: JlptSelfLevel, reason: LearningReason) => Promise<void>;
  refreshAdminRole: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    isAdmin: false,
    isLoading: true,
    isAuthenticated: false,
    hasSeenOnboarding: false,
    jlptLevel: null,
    chineseLevel: null,
    reason: null,
  });

  useEffect(() => {
    const offRef = subscribeAccessTokenRefreshed((newToken) => {
      void (async () => {
        const isAdmin = await syncAdminFromServer(newToken);
        setState((s) => ({
          ...s,
          token: newToken,
          isAuthenticated: !!newToken,
          isAdmin,
        }));
      })();
    });
    const offClr = subscribeSessionCleared(() => {
      setState((s) => ({ ...s, token: null, isAuthenticated: false, isAdmin: false }));
    });
    return () => {
      offRef();
      offClr();
    };
  }, []);

  useEffect(() => {
    void bootstrap();
    async function bootstrap() {
      let token: string | null = null;
      let hasSeenOnboarding = false;
      let jlptLevel: JlptSelfLevel | null = null;
      let reason: LearningReason | null = null;
      try {
        token = await restoreStoredAccessToken();
        const flag = await getItem(ONBOARDING_KEY);
        hasSeenOnboarding = flag === 'true';
        const localLevel = (await getItem(LEVEL_KEY)) ?? (await getItem(LEGACY_LEVEL_KEY));
        jlptLevel = migrateStoredLevel(localLevel);
        reason = (await getItem(REASON_KEY)) as LearningReason | null;
        if (jlptLevel) {
          await setItem(LEVEL_KEY, jlptLevel);
          await removeItem(LEGACY_LEVEL_KEY);
        }
        if (token) {
          try {
            const remote = await api.user.preferences(token);
            jlptLevel = (remote.data.self_level as JlptSelfLevel | null) ?? jlptLevel;
            reason = (remote.data.learning_reason as LearningReason | null) ?? reason;
            if (jlptLevel) await setItem(LEVEL_KEY, jlptLevel);
            if (reason) await setItem(REASON_KEY, reason);
          } catch {
            // Older deployments may not have the preferences migration yet; local values remain usable.
          }
        }
      } catch (e) {
        console.error('Auth bootstrap failed', e);
      }
      const isAdmin = await syncAdminFromServer(token);
      setState({
        token,
        isAdmin,
        isLoading: false,
        isAuthenticated: !!token,
        hasSeenOnboarding,
        jlptLevel,
        chineseLevel: jlptLevel,
        reason,
      });
    }
  }, []);

  const signIn = async (tokens: { access_token: string; refresh_token: string }) => {
    await persistSession(tokens.access_token, tokens.refresh_token);
    const isAdmin = await syncAdminFromServer(tokens.access_token);
    let jlptLevel = state.jlptLevel;
    let reason = state.reason;
    try {
      const remote = await api.user.preferences(tokens.access_token);
      jlptLevel = (remote.data.self_level as JlptSelfLevel | null) ?? jlptLevel;
      reason = (remote.data.learning_reason as LearningReason | null) ?? reason;
    } catch {
      // Keep local preferences if the server preference endpoint is unavailable.
    }
    setState((s) => ({
      ...s,
      token: tokens.access_token,
      isAuthenticated: true,
      isAdmin,
      jlptLevel,
      chineseLevel: jlptLevel,
      reason,
    }));
  };

  const signOut = async () => {
    const refresh = await getItem(AUTH_REFRESH_TOKEN_KEY);
    if (refresh) {
      try { await api.auth.logout(refresh); } catch { /* ignore */ }
    }
    await removeItem(AUTH_ACCESS_TOKEN_KEY);
    await removeItem(AUTH_REFRESH_TOKEN_KEY);
    setState((s) => ({ ...s, token: null, isAuthenticated: false, isAdmin: false }));
  };

  const completeOnboarding = async () => {
    await setItem(ONBOARDING_KEY, 'true');
    setState((s) => ({ ...s, hasSeenOnboarding: true }));
  };

  const saveSetup = async (level: JlptSelfLevel, reason: LearningReason) => {
    await setItem(LEVEL_KEY, level);
    await setItem(REASON_KEY, reason);
    setState((s) => ({ ...s, jlptLevel: level, chineseLevel: level, reason }));
  };

  const refreshAdminRole = useCallback(async () => {
    const isAdmin = await refreshStoredAdminFlag();
    setState((s) => ({ ...s, isAdmin }));
    return isAdmin;
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signOut, completeOnboarding, saveSetup, refreshAdminRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
