/** Local, nonsecret reading vocabulary. Writes are serialized across screens. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mergeLearnedWords, genuinelyNewWords, type LearnedWord } from "./learnedWordsMerge";

export type { LearnedWord } from "./learnedWordsMerge";
const LEARNED_WORDS_KEY = "learning_loop_learned_words";
const READ_BOOKS_KEY = "learning_loop_read_books";
let mutation: Promise<unknown> = Promise.resolve();

async function readStrict(): Promise<LearnedWord[]> {
  const raw = await AsyncStorage.getItem(LEARNED_WORDS_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw Error("Saved vocabulary is not a list");
  return mergeLearnedWords(parsed as LearnedWord[], []);
}

export async function loadLearnedWords(): Promise<LearnedWord[]> {
  try { return await readStrict(); }
  catch { return []; }
}

/** Never claim saving succeeded if storage is unavailable or corrupt. */
export function addLearnedWords(words: LearnedWord[]): Promise<number> {
  const write = mutation.catch(() => undefined).then(async () => {
    const existing = await readStrict();
    const merged = mergeLearnedWords(existing, words);
    const count = genuinelyNewWords(existing, words);
    if (count || merged.length !== existing.length) {
      await AsyncStorage.setItem(LEARNED_WORDS_KEY, JSON.stringify(merged));
    }
    return count;
  });
  mutation = write;
  return write;
}

export async function clearLearnedWords(): Promise<void> {
  const clear = mutation.catch(() => undefined).then(() => AsyncStorage.removeItem(LEARNED_WORDS_KEY));
  mutation = clear;
  await clear;
}

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
    await AsyncStorage.setItem(READ_BOOKS_KEY, JSON.stringify([...existing, bookId]));
  } catch {}
}

export async function isBookRead(bookId: string): Promise<boolean> {
  const read = await loadReadBooks();
  return read.includes(bookId);
}
