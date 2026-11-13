/** Нэг мөр: канжи тэмдэгт / romaji ### монгол утга (ж: сургалтын paste). */

const SPLIT = /\s+###\s+/;
const LEFT_KANJI_ROMAJI = /^(\S+?)\s+(.+)$/u;

export type ParsedImportLineOk = { ok: true; kanji: string; romaji: string; meaning_mn: string };
export type ParsedImportLineErr = { ok: false; line: string; reason: string };
export type ParsedImportLine = ParsedImportLineOk | ParsedImportLineErr;

export function parseKanjiImportLines(text: string): ParsedImportLine[] {
  const out: ParsedImportLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const segs = line.split(SPLIT);
    if (segs.length < 2) {
      out.push({ ok: false, line, reason: '### Тусгаарлагч олдсонгүй' });
      continue;
    }

    const left = segs[0]!.trim();
    const meaning_mn = segs.slice(1).join(' ### ').trim();
    if (!meaning_mn) {
      out.push({ ok: false, line, reason: 'Монгол утга хоосон' });
      continue;
    }

    const lm = left.match(LEFT_KANJI_ROMAJI);
    if (!lm) {
      out.push({
        ok: false,
        line,
        reason: 'Эхлээд үг (канжи/кана), дараа нь romaji байх ёстой',
      });
      continue;
    }

    const kanji = lm[1]!.trim();
    const romaji = lm[2]!.trim();
    if (!kanji || !romaji) {
      out.push({ ok: false, line, reason: 'Канжи эсвэл romaji хоосон' });
      continue;
    }

    out.push({ ok: true, kanji, romaji, meaning_mn });
  }
  return out;
}
