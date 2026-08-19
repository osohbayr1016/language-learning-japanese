/** Count Han-script codepoints in a JP/中文 surface form. */
export function countHanScriptInString(raw: unknown): number {
  if (raw == null || typeof raw !== "string") return 0;
  const m = raw.match(/\p{Script=Han}/gu);
  return m ? m.length : 0;
}

/** Exactly one Han codepoint somewhere in the string (e.g. 食べる counts as 1). */
export function hasExactlyOneHanScriptChar(raw: unknown): boolean {
  return countHanScriptInString(raw) === 1;
}

/** Lemma is exactly one grapheme and it is Han (exclude 食べる/大きい/見る — keep 私). */
export function isSingleKanjiGlyphOnly(raw: unknown): boolean {
  if (raw == null || typeof raw !== "string") return false;
  const s = raw.normalize("NFC").trim();
  if (!s) return false;
  const glyphs = [...s];
  if (glyphs.length !== 1) return false;
  return /\p{Script=Han}/u.test(glyphs[0] ?? "");
}
