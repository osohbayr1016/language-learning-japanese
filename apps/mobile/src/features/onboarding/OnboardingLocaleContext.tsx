import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { OnboardingLocaleCode } from './onboardingCopy';
import { getOnboardingStrings } from './onboardingCopy';

const STORAGE_KEY = '@onboarding_ui_locale';

type Value = {
  locale: OnboardingLocaleCode;
  setLocale: (l: OnboardingLocaleCode) => void;
};

const Ctx = createContext<Value | null>(null);

export function OnboardingLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<OnboardingLocaleCode>('mn');

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (cancelled) return;
      if (raw === 'mn' || raw === 'en' || raw === 'ja') setLocaleState(raw);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((l: OnboardingLocaleCode) => {
    setLocaleState(l);
    void AsyncStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboardingLocale() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboardingLocale requires OnboardingLocaleProvider');
  return v;
}

export function useOnboardingStrings(step: number, total: number) {
  const { locale } = useOnboardingLocale();
  return useMemo(() => getOnboardingStrings(locale, step, total), [locale, step, total]);
}
