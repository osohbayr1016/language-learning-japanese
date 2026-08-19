import { useEffect, useState, useCallback } from 'react';
import { getLearnedKanjis, type LearnedKanji } from '../lib/learnedKanjisStorage';
import { useFocusEffect } from 'expo-router';

export function useLearnedKanjis() {
  const [kanjis, setKanjis] = useState<LearnedKanji[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const stored = await getLearnedKanjis();
      setKanjis(stored);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { kanjis, loading, reload: load };
}
