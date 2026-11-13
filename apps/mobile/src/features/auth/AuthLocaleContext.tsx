import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AUTH_LOCALE_COPY,
  type AuthLocaleCode,
  type AuthLocaleStrings,
} from '../../i18n/authLocales';
import { getItem, setItem } from '../../lib/storage';

const KEY = '@auth_ui_locale';

type Ctx = {
  locale: AuthLocaleCode;
  strings: AuthLocaleStrings;
  setLocale: (code: AuthLocaleCode) => Promise<void>;
};

const C = createContext<Ctx | undefined>(undefined);

export function AuthLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setState] = useState<AuthLocaleCode>('mn');

  useEffect(() => {
    void (async () => {
      const raw = await getItem(KEY);
      if (raw === 'ja' || raw === 'en' || raw === 'mn') setState(raw);
    })();
  }, []);

  const setLocale = useCallback(async (code: AuthLocaleCode) => {
    setState(code);
    await setItem(KEY, code);
  }, []);

  const strings = useMemo(() => AUTH_LOCALE_COPY[locale], [locale]);

  const value = useMemo<Ctx>(() => ({ locale, strings, setLocale }), [locale, strings, setLocale]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useAuthLocale() {
  const x = useContext(C);
  if (!x) throw new Error('useAuthLocale must be within AuthLocaleProvider');
  return x;
}
