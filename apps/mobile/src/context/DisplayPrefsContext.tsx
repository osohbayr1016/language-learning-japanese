import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getItem, removeItem, setItem } from '../lib/storage';

const ROMAJI_KEY = 'show_romaji_study';
const LEGACY_PINYIN_KEY = 'show_pinyin_study';

type Ctx = {
  showRomaji: boolean;
  setShowRomaji: (v: boolean) => Promise<void>;
  toggleShowRomaji: () => Promise<void>;
  /** @deprecated compatibility aliases; migrate call sites to Romaji naming. */
  showPinyin: boolean;
  setShowPinyin: (v: boolean) => Promise<void>;
  toggleShowPinyin: () => Promise<void>;
};

const C = createContext<Ctx | undefined>(undefined);

export function DisplayPrefsProvider({ children }: { children: React.ReactNode }) {
  const [showRomaji, setState] = useState(true);

  useEffect(() => {
    void (async () => {
      const canonical = await getItem(ROMAJI_KEY);
      const legacy = canonical == null ? await getItem(LEGACY_PINYIN_KEY) : null;
      const raw = canonical ?? legacy;
      if (raw === '0') setState(false);
      else if (raw === '1') setState(true);

      if (canonical == null && legacy != null) {
        await setItem(ROMAJI_KEY, legacy);
        await removeItem(LEGACY_PINYIN_KEY);
      }
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
        showPinyin: showRomaji,
        setShowPinyin: setShowRomaji,
        toggleShowPinyin: toggleShowRomaji,
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
