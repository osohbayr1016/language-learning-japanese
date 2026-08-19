import { useCallback, useEffect, useState } from 'react';
import {
  loadLearnedWords,
  addLearnedWords,
  type LearnedWord,
} from '../lib/learnedWordsStorage';

export function useLearnedWords() {
  const [words, setWords] = useState<LearnedWord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await loadLearnedWords();
    setWords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(async (newWords: LearnedWord[]) => {
    await addLearnedWords(newWords);
    await reload();
  }, [reload]);

  return { words, loading, reload, add };
}
