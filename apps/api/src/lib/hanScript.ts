/** Han-script helpers for lemma filtering (single glyph vs mixed okurigana rows). */
export function countHanScriptInString(raw: unknown): number {
  if (raw == null || typeof raw !== "string") return 0;
  const m = raw.match(/\p{Script=Han}/gu);
  return m ? m.length : 0;
}

export function hasExactlyOneHanScriptChar(raw: unknown): boolean {
  return countHanScriptInString(raw) === 1;
}

export function isSingleKanjiGlyphOnly(raw: unknown): boolean {
  if (raw == null || typeof raw !== "string") return false;
  const s = raw.normalize("NFC").trim();
  if (!s) return false;
  const glyphs = [...s];
  if (glyphs.length !== 1) return false;
  return /\p{Script=Han}/u.test(glyphs[0] ?? "");
}
