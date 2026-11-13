import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getItem, removeItem, setItem } from '../lib/storage';

const ROMAJI_KEY = 'show_romaji_study';

type Ctx = {
  showRomaji: boolean;
  setShowRomaji: (v: boolean) => Promise<void>;
  toggleShowRomaji: () => Promise<void>;
};

const C = createContext<Ctx | undefined>(undefined);

export function DisplayPrefsProvider({ children }: { children: React.ReactNode }) {
  const [showRomaji, setState] = useState(true);

  useEffect(() => {
    void (async () => {
      const canonical = await getItem(ROMAJI_KEY);
      const raw = canonical;
      if (raw === '0') setState(false);
      else if (raw === '1') setState(true);


    })();
  }, []);

  const setShowRomaji = useCallback(async (v: boolean) => {
    setState(v);
    await setItem(ROMAJI_KEY, v ? '1' : '0');
  }, []);

  const toggleShowRomaji = useCallback(async () => {
    await setShowRomaji(!showRomaji);
  }, [showRomaji, setShowRomaji]);

  return (
    <C.Provider
      value={{
        showRomaji,
        setShowRomaji,
        toggleShowRomaji,
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useDisplayPrefs() {
  const x = useContext(C);
  if (!x) throw new Error('useDisplayPrefs must be within DisplayPrefsProvider');
  return x;
}
