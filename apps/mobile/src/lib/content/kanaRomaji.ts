import { HIRAGANA_ROWS, KATAKANA_ROWS } from './kanaTable';

const ROMAJI_ROWS: string[][] = [
  ['a', 'i', 'u', 'e', 'o'],
  ['ka', 'ki', 'ku', 'ke', 'ko'],
  ['sa', 'shi', 'su', 'se', 'so'],
  ['ta', 'chi', 'tsu', 'te', 'to'],
  ['na', 'ni', 'nu', 'ne', 'no'],
  ['ha', 'hi', 'fu', 'he', 'ho'],
  ['ma', 'mi', 'mu', 'me', 'mo'],
  ['ya', 'yu', 'yo', '', ''],
  ['ra', 'ri', 'ru', 're', 'ro'],
  ['wa', 'wo', 'n', '', ''],
];

function buildMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (let i = 0; i < HIRAGANA_ROWS.length; i++) {
    const hRow = HIRAGANA_ROWS[i];
    const kRow = KATAKANA_ROWS[i];
    const rRow = ROMAJI_ROWS[i];
    for (let j = 0; j < hRow.length; j++) {
      const roma = rRow[j];
      if (!roma) continue;
      if (hRow[j]) map[hRow[j]] = roma;
      if (kRow[j]) map[kRow[j]] = roma;
    }
  }
  return map;
}

const MAP = buildMap();

export function getKanaRomaji(character: string): string {
  const ch = Array.from(character.trim())[0];
  return (ch && MAP[ch]) ?? '';
}
