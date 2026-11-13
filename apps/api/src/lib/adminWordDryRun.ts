import { validateKanjiField, sumStrokesForKanjiPhrase, type AdminWordCreateInput } from './adminCreateWord';

/** Серверээс канжи болон KanjiWriter шалгах (өгөгдөл хадгалахгүй). */
export async function dryRunValidateAdminWord(
  raw: AdminWordCreateInput
): Promise<
  | { ok: true; kanji: string; strokeCount: number }
  | { ok: false; kanji: string; error: string }
> {
  const kjRaw = typeof raw.kanji === 'string' ? raw.kanji.trim() : '';
  const v = validateKanjiField(kjRaw);
  if ('error' in v) return { ok: false, kanji: kjRaw || '—', error: v.error };

  const romaji = typeof raw.romaji === 'string' ? raw.romaji.trim() : '';
  const meaning_mn = typeof raw.meaning_mn === 'string' ? raw.meaning_mn.trim() : '';
  if (!romaji || !meaning_mn) {
    return { ok: false, kanji: v.ok, error: 'Romaji болон монгол утга заавал' };
  }

  const strokes = await sumStrokesForKanjiPhrase(v.ok);
  if ('error' in strokes) return { ok: false, kanji: v.ok, error: strokes.error };

  return { ok: true, kanji: v.ok, strokeCount: strokes.strokeCount };
}

function pairKey(kanji: string, meaningMn: string): string {
  return `${kanji}\u0001${meaningMn}`;
}

/** Олон давхцлыг өгөгдөлд байгаа эсэх шалгаж set буцаана. */
export async function fetchExistingKanjiMnPairs(
  db: D1Database,
  pairs: { kanji: string; meaning_mn: string }[]
): Promise<Set<string>> {
  const out = new Set<string>();
  const seen = new Map<string, { kanji: string; meaning_mn: string }>();
  for (const p of pairs) {
    const k = pairKey(p.kanji.trim(), p.meaning_mn.trim());
    seen.set(k, { kanji: p.kanji.trim(), meaning_mn: p.meaning_mn.trim() });
  }
  const unique = [...seen.values()];
  if (unique.length === 0) return out;

  const CHUNK = 40;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const slice = unique.slice(i, i + CHUNK);
    const cond = slice.map(() => '(kanji = ? AND meaning_mn = ?)').join(' OR ');
    const args = slice.flatMap((p) => [p.kanji, p.meaning_mn]);
    const q = await db.prepare(`SELECT kanji, meaning_mn FROM words WHERE ${cond}`).bind(...args).all();
    for (const row of q.results ?? []) {
      const r = row as { kanji: string; meaning_mn: string };
      out.add(pairKey(r.kanji, r.meaning_mn));
    }
  }
  return out;
}

// Re-export legacy name for backwards compat within this session
