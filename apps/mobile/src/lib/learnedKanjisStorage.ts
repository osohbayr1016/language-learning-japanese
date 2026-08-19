import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Word } from './types';

const LEARNED_KANJIS_KEY = 'LEARNED_KANJIS_STORAGE_KEY';

export type LearnedKanji = Pick<Word, 'id' | 'kanji' | 'meaning_mn' | 'romaji' | 'jlpt_level'> & {
  learnedAt: number;
};

/** Load all learned kanjis */
export async function getLearnedKanjis(): Promise<LearnedKanji[]> {
  try {
    const raw = await AsyncStorage.getItem(LEARNED_KANJIS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LearnedKanji[];
  } catch (e) {
    console.warn('Failed to load learned kanjis', e);
    return [];
  }
}

/** Add a kanji to the learned list */
export async function addLearnedKanji(word: Word): Promise<void> {
  try {
    const existing = await getLearnedKanjis();
    // Check if already learned
    if (existing.some((k) => k.id === word.id)) return;

    const newKanji: LearnedKanji = {
      id: word.id,
      kanji: word.kanji,
      meaning_mn: word.meaning_mn,
      romaji: word.romaji,
      jlpt_level: word.jlpt_level,
      learnedAt: Date.now(),
    };

    existing.push(newKanji);
    await AsyncStorage.setItem(LEARNED_KANJIS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to add learned kanji', e);
  }
}
