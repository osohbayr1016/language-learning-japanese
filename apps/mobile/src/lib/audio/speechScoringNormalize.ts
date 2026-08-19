/**
 * Japanese text normalization for speech scoring.
 *
 * A `ja-JP` recognizer returns mixed kanji/kana and picks its own orthography,
 * so the same correct utterance can come back as 食べる, たべる or ﾀﾍﾞﾙ. These
 * helpers fold those spellings onto one comparable form.
 */

const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;
/** Distance between a katakana code point and its hiragana twin. */
const KANA_SHIFT = 0x60;

const KANJI = /[㐀-䶿一-鿿豈-﫿]/;
const KANA = /[ぁ-ゖゝゞァ-ヺーヽヾ]/;
/** 々〆〇 — word-forming marks, not punctuation. */
const ITERATION = /[々-〇]/;

export function isJapaneseChar(ch: string): boolean {
  return KANJI.test(ch) || KANA.test(ch) || ITERATION.test(ch);
}

/** NFKC (half-width kana → full width), then Japanese script characters only. */
export function extractJapaneseChars(raw: string): string[] {
  return Array.from(raw.normalize('NFKC')).filter(isJapaneseChar);
}

/** Drop spaces, punctuation and latin so two Japanese strings compare cleanly. */
export function jaNorm(s: string): string {
  return extractJapaneseChars(s).join('');
}

/** Katakana → hiragana, so テスト and てすと compare equal. */
export function toHiragana(s: string): string {
  return Array.from(s.normalize('NFKC'))
    .map((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      return c >= KATAKANA_START && c <= KATAKANA_END ? String.fromCodePoint(c - KANA_SHIFT) : ch;
    })
    .join('');
}

const VOWEL_ROWS: ReadonlyArray<readonly [string, string]> = [
  ['あ', 'あかさたなはまやらわがざだばぱぁゃゎゕ'],
  ['い', 'いきしちにひみりゐぎじぢびぴぃ'],
  ['う', 'うくすつぬふむゆるぐずづぶぷゔぅゅ'],
  ['え', 'えけせてねへめれゑげぜでべぺぇゖ'],
  ['お', 'おこそとのほもよろをごぞどぼぽぉょ'],
];

const VOWEL_OF = new Map<string, string>();
for (const [vowel, row] of VOWEL_ROWS) {
  for (const kana of row) VOWEL_OF.set(kana, vowel);
}

/** Expand ー onto the vowel it lengthens: こーひー → こおひい. */
function expandProlonged(hiragana: string): string {
  let out = '';
  for (const ch of hiragana) {
    if (ch === 'ー') out += VOWEL_OF.get(out[out.length - 1] ?? '') ?? '';
    else out += ch;
  }
  return out;
}

const O_ROW = 'おこそとのほもよろごぞどぼぽょ';
const E_ROW = 'えけせてねへめれげぜでべぺ';
const LONG_O = new RegExp(`([${O_ROW}])う`, 'g');
const LONG_E = new RegExp(`([${E_ROW}])い`, 'g');

/**
 * Fold kana onto how it is pronounced, so a correct utterance is never marked
 * wrong over spelling: こう/こお, けい/けえ, ぢ/じ, づ/ず, を/お all collapse.
 * Kanji in the input is left alone.
 */
export function foldReading(s: string): string {
  return expandProlonged(toHiragana(jaNorm(s)))
    .replace(/ぢ/g, 'じ')
    .replace(/づ/g, 'ず')
    .replace(/を/g, 'お')
    .replace(LONG_O, '$1お')
    .replace(LONG_E, '$1え');
}

/** Small kana bind to the mora before them (きょ is one mora, っ ん ー are their own). */
const SMALL_FOLLOWERS = new Set(Array.from('ぁぃぅぇぉゃゅょゎ'));

/** Split a kana reading into mora. */
export function kanaMora(reading: string): string[] {
  const out: string[] = [];
  for (const ch of toHiragana(jaNorm(reading))) {
    if (out.length > 0 && SMALL_FOLLOWERS.has(ch)) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

/** Lower-case latin only, macrons folded: Tōkyō → tokyo. */
function latinOnly(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Romaji letters, used when the recognizer hands back latin text. */
export function romajiChars(raw: string): string[] {
  return Array.from(latinOnly(raw).replace(/[^a-z]+/g, ''));
}

/** Whitespace-separated romaji words, used to label characters with their reading. */
export function romajiTokens(raw: string): string[] {
  return latinOnly(raw).match(/[a-z]+/g) ?? [];
}
