/**
 * Local AsyncStorage-based storage for words learned through the Learning Loop.
 * Each learned word is stored with its full data and the date it was learned.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LEARNED_WORDS_KEY = 'learning_loop_learned_words';
const READ_BOOKS_KEY = 'learning_loop_read_books';

export type LearnedWord = {
  id: string | number;
  kana: string;
  kanji?: string;
  romaji?: string;
  meaning_mn?: string;
  learnedAt: number; // timestamp
  categoryId?: string;
};

// ─── Learned Words ─────────────────────────────────────────────────────────

export async function loadLearnedWords(): Promise<LearnedWord[]> {
  try {
    const raw = await AsyncStorage.getItem(LEARNED_WORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LearnedWord[];
  } catch {
    return [];
  }
}

export async function addLearnedWords(words: LearnedWord[]): Promise<void> {
  try {
    const existing = await loadLearnedWords();
    const existingIds = new Set(existing.map((w) => String(w.id)));
    const newWords = words.filter((w) => !existingIds.has(String(w.id)));
    if (newWords.length === 0) return;
    await AsyncStorage.setItem(
      LEARNED_WORDS_KEY,
      JSON.stringify([...existing, ...newWords])
    );
  } catch {}
}

export async function clearLearnedWords(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEARNED_WORDS_KEY);
  } catch {}
}

// ─── Read Books ─────────────────────────────────────────────────────────────

export async function loadReadBooks(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(READ_BOOKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function markBookAsRead(bookId: string): Promise<void> {
  try {
    const existing = await loadReadBooks();
    if (existing.includes(bookId)) return;
    await AsyncStorage.setItem(
      READ_BOOKS_KEY,
      JSON.stringify([...existing, bookId])
    );
  } catch {}
}

export async function isBookRead(bookId: string): Promise<boolean> {
  const read = await loadReadBooks();
  return read.includes(bookId);
}
