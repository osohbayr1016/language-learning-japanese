export type LearnedWord = {
  id: string | number;
  kana: string;
  kanji?: string;
  romaji?: string;
  meaning_mn?: string;
  learnedAt: number;
  categoryId?: string;
};

function identity(word: LearnedWord): string {
  const kana = word.kana.normalize("NFKC").trim();
  const kanji = (word.kanji ?? "").normalize("NFKC").trim();
  const meaning = (word.meaning_mn ?? "").normalize("NFKC").trim().toLowerCase();
  // Preserve distinct homographs with different Mongolian meanings.
  return JSON.stringify([kana, kanji, meaning]);
}

/** Merge past random-ID entries without duplicate vocabulary cards. */
export function mergeLearnedWords(existing: readonly LearnedWord[], added: readonly LearnedWord[]): LearnedWord[] {
  const byKey = new Map<string, LearnedWord>();
  for(const word of [...existing, ...added]){
    if (!word || typeof word.kana !== "string" || !word.kana.trim() ||
        (typeof word.id !== "string" && typeof word.id !== "number") ||
        !Number.isFinite(word.learnedAt)) continue;
    const key = identity(word);
    if(!byKey.has(key)) byKey.set(key, word);
  }
  return [...byKey.values()];
}

export function genuinelyNewWords(existing: readonly LearnedWord[], added: readonly LearnedWord[]): number {
  return mergeLearnedWords(existing, added).length - mergeLearnedWords(existing, []).length;
}
