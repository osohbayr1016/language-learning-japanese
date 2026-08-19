import { api } from "../api";
import { getApiBase } from "../api/client";
import { DEFAULT_PRODUCTION_API } from "../api/publicUrl";
import { isSingleKanjiGlyphOnly } from "../japanese/hanScript";
import type { Word, WordWithProgress } from "../types";

function asProgress(rows: Word[] | undefined): WordWithProgress[] {
  return (rows ?? []).map((w) => ({
    ...w,
    ease_factor: null,
    interval: null,
    repetitions: null,
    next_review: null,
    last_reviewed: null,
  }));
}

function uniqueBases(): string[] {
  const a = getApiBase().replace(/\/+$/, "");
  const b = DEFAULT_PRODUCTION_API.replace(/\/+$/, "");
  return a === b ? [a] : [a, b];
}

/** Вэб дээр request() эсвэл буруу суурь → хоосон; шууд fetch нь илүү найдвартай. */
async function fetchPublicWordsViaFetch(
  limit: number,
  jlpt?: number,
  singleChar?: boolean,
): Promise<Word[]> {
  const n = Math.max(limit, 30);
  const sp = new URLSearchParams({ limit: String(n) });
  if (jlpt != null) sp.set("jlpt", String(jlpt));
  if (singleChar) sp.set("single_char", "1");

  for (const base of uniqueBases()) {
    const url = `${base}/api/words?${sp.toString()}`;
    try {
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      if (!res.ok) continue;
      const j = JSON.parse(text) as { data?: Word[] };
      if (Array.isArray(j.data) && j.data.length > 0) return j.data;
    } catch {
      /* try next base */
    }
  }
  return [];
}

/** Auth queue first; дараа нь public list; эцэст нь шууд fetch fallback (вэб SPA/суурь алдааг давах). */
export async function fetchStudyWords(
  token: string | null,
  limit: number,
  mode?: "writer",
): Promise<WordWithProgress[]> {
  if (token) {
    try {
      const res = await api.words.due(
        token,
        limit,
        mode === "writer" ? { mode: "writer" } : undefined,
      );
      const due = res.data ?? [];
      if (due.length > 0) {
        const pick =
          mode === "writer"
            ? due.filter((w) => isSingleKanjiGlyphOnly(w.kanji))
            : due;
        if (pick.length > 0) return pick.slice(0, limit);
      }
    } catch {
      /* fall through */
    }
  }

  let rows: WordWithProgress[] = [];
  const singleChar = mode === "writer" ? 1 : undefined;
  try {
    const pub = await api.words.list({
      limit: Math.max(limit, 30),
      jlpt: 1,
      single_char: singleChar,
    });
    rows = asProgress(pub.data);
  } catch {
    rows = [];
  }
  if (rows.length === 0) {
    try {
      const any = await api.words.list({
        limit: Math.max(limit, 30),
        single_char: singleChar,
      });
      rows = asProgress(any.data);
    } catch {
      rows = [];
    }
  }
  if (rows.length === 0) {
    let raw = await fetchPublicWordsViaFetch(limit, 1, singleChar != null);
    if (raw.length === 0)
      raw = await fetchPublicWordsViaFetch(
        limit,
        undefined,
        singleChar != null,
      );
    rows = asProgress(raw);
  }

  if (mode === "writer") {
    rows = rows.filter((w) => isSingleKanjiGlyphOnly(w.kanji));
  }

  return rows.slice(0, limit);
}
