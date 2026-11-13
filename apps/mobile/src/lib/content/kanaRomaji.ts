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

const voicedRows = [
 ['がぎぐげご','ga gi gu ge go'],['ざじずぜぞ','za ji zu ze zo'],['だぢづでど','da ji zu de do'],['ばびぶべぼ','ba bi bu be bo'],['ぱぴぷぺぽ','pa pi pu pe po']
];
for(const [glyphs,sounds] of voicedRows) Array.from(glyphs).forEach((c,i)=>{MAP[c]=sounds.split(' ')[i];MAP[String.fromCodePoint(c.codePointAt(0)!+96)]=MAP[c]});
for(const [base,roma] of [['き','ky'],['し','sh'],['ち','ch'],['に','ny'],['ひ','hy'],['み','my'],['り','ry'],['ぎ','gy'],['じ','j'],['び','by'],['ぴ','py']]) {
 for(const [suffix,vowel] of [['ゃ','a'],['ゅ','u'],['ょ','o']]){const pair=base+suffix;MAP[pair]=roma+vowel;MAP[Array.from(pair).map(c=>String.fromCodePoint(c.codePointAt(0)!+96)).join('')]=roma+vowel;}
}
MAP['っ']='нэг мора завсар';MAP['ッ']=MAP['っ'];MAP['ー']='урт эгшиг';
export function getKanaRomaji(character: string): string {return MAP[character.trim()] ?? '';}
