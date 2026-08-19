import { Hono } from "hono";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { Env, Variables } from "../types";
import { fetchDueWordsQueue } from "../lib/dueWordsQueue";
import { jsonBodyInvalid, readJsonBody } from "../lib/requestJson";
import { isSingleKanjiGlyphOnly } from "../lib/hanScript";

const words = new Hono<{ Bindings: Env; Variables: Variables }>();

type WordRow = Record<string, unknown> & { kanji?: string };

// GET /api/words — public
words.get("/", async (c) => {
  const jlpt = c.req.query("jlpt");
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 500);
  const offset = Number(c.req.query("offset") ?? 0);
  const search = c.req.query("q");
  const singleCharRaw = c.req.query("single_char");
  const singleChar =
    singleCharRaw === "1" ||
    singleCharRaw === "true" ||
    singleCharRaw === "yes";

  const whereParts = ["1=1"];
  const whereParams: (string | number)[] = [];

  if (jlpt) {
    whereParts.push("jlpt_level = ?");
    whereParams.push(Number(jlpt));
  }

  if (search) {
    whereParts.push(
      "(kanji LIKE ? OR romaji LIKE ? OR meaning_mn LIKE ?)",
    );
    const p = `%${search}%`;
    whereParams.push(p, p, p);
  }

  const textbookUnit = (c.req.query("textbook_unit") ?? "").trim();
  if (textbookUnit) {
    whereParts.push("textbook_unit = ?");
    whereParams.push(textbookUnit);
  }

  const whereSql = whereParts.join(" AND ");

  if (singleChar) {
    const BATCH = 300;
    const matched: WordRow[] = [];
    let sqlOffset = 0;
    let dbEnded = false;
    while (!dbEnded && sqlOffset < 80_000) {
      const q = `SELECT * FROM words WHERE ${whereSql} ORDER BY jlpt_level ASC, id ASC LIMIT ? OFFSET ?`;
      const r = await c.env.DB.prepare(q)
        .bind(...whereParams, BATCH, sqlOffset)
        .all();
      const batch = (r.results ?? []) as WordRow[];
      if (batch.length === 0) dbEnded = true;
      else {
        sqlOffset += BATCH;
        for (const row of batch) {
          if (isSingleKanjiGlyphOnly(row.kanji)) matched.push(row);
        }
      }
    }

    const data = matched.slice(offset, offset + limit);
    const total = matched.length;
    const hasMore = offset + limit < total;
    return c.json({
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      has_more: hasMore,
    });
  }

  let query = `SELECT * FROM words WHERE ${whereSql}`;
  let countSql = `SELECT COUNT(*) AS count FROM words WHERE ${whereSql}`;
  query += " ORDER BY jlpt_level ASC, id ASC LIMIT ? OFFSET ?";
  const params = [...whereParams, limit, offset];

  const [rows, total] = await Promise.all([
    c.env.DB.prepare(query)
      .bind(...params)
      .all(),
    c.env.DB.prepare(countSql).bind(...whereParams).first<{ count: number }>(),
  ]);

  const count = total?.count ?? 0;

  return c.json({
    data: rows.results,
    total: count,
    page: Math.floor(offset / limit) + 1,
    limit,
    has_more: offset + limit < count,
  });
});

// GET /api/words/due — protected SRS + lesson-path vocabulary (optional mode=writer)
words.get("/due", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const limit = Number(c.req.query("limit") ?? 20);
  const writerOnly = (c.req.query("mode") ?? "") === "writer";

  const data = await fetchDueWordsQueue(c.env.DB, sub, limit, { writerOnly });
  return c.json({ data });
});

// GET /api/words/:id — public
words.get("/:id", async (c) => {
  const word = await c.env.DB.prepare("SELECT * FROM words WHERE id = ?")
    .bind(c.req.param("id"))
    .first();

  if (!word) return c.json({ error: "Үг олдсонгүй" }, 404);

  return c.json({ data: word });
});

// POST /api/words — admin only
words.post("/", authMiddleware, adminMiddleware, async (c) => {
  const body = await readJsonBody<{
    kanji: string;
    romaji: string;
    romaji_numbered?: string;
    kana?: string;
    meaning_mn: string;
    meaning_en?: string;
    jlpt_level: number;
    part_of_speech?: string;
    example_jp?: string;
    example_romaji?: string;
    example_mn?: string;
    stroke_count?: number;
  }>(c);
  if (!body) return jsonBodyInvalid(c);

  const result = await c.env.DB.prepare(
    `INSERT INTO words (kanji, romaji, romaji_numbered, kana, meaning_mn, meaning_en,
     jlpt_level, part_of_speech, example_jp, example_romaji, example_mn, stroke_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(
      body.kanji,
      body.romaji,
      body.romaji_numbered ?? body.romaji,
      body.kana ?? "",
      body.meaning_mn,
      body.meaning_en ?? "",
      body.jlpt_level,
      body.part_of_speech ?? "noun",
      body.example_jp ?? "",
      body.example_romaji ?? "",
      body.example_mn ?? "",
      body.stroke_count ?? 0,
    )
    .first<{ id: number }>();

  return c.json({ data: { id: result?.id }, message: "Үг нэмэгдлээ" }, 201);
});

// PUT /api/words/:id — admin only
words.put("/:id", authMiddleware, adminMiddleware, async (c) => {
  const body = await readJsonBody<{
    kanji?: string;
    romaji?: string;
    romaji_numbered?: string;
    kana?: string;
    meaning_mn?: string;
    meaning_en?: string;
    jlpt_level?: number;
    part_of_speech?: string;
    example_jp?: string;
    example_romaji?: string;
    example_mn?: string;
    audio_url?: string;
    stroke_count?: number;
  }>(c);
  if (!body) return jsonBodyInvalid(c);
  const id = c.req.param("id");

  await c.env.DB.prepare(
    `UPDATE words SET
       kanji = COALESCE(?, kanji),
       romaji = COALESCE(?, romaji),
       romaji_numbered = COALESCE(?, romaji_numbered),
       kana = COALESCE(?, kana),
       meaning_mn = COALESCE(?, meaning_mn),
       meaning_en = COALESCE(?, meaning_en),
       jlpt_level = COALESCE(?, jlpt_level),
       part_of_speech = COALESCE(?, part_of_speech),
       example_jp = COALESCE(?, example_jp),
       example_romaji = COALESCE(?, example_romaji),
       example_mn = COALESCE(?, example_mn),
       audio_url = COALESCE(?, audio_url),
       stroke_count = COALESCE(?, stroke_count)
     WHERE id = ?`,
  )
    .bind(
      body.kanji ?? null,
      body.romaji ?? null,
      body.romaji_numbered ?? null,
      body.kana ?? null,
      body.meaning_mn ?? null,
      body.meaning_en ?? null,
      body.jlpt_level ?? null,
      body.part_of_speech ?? null,
      body.example_jp ?? null,
      body.example_romaji ?? null,
      body.example_mn ?? null,
      body.audio_url ?? null,
      body.stroke_count ?? null,
      id,
    )
    .run();

  return c.json({ message: "Үг шинэчлэгдлээ" });
});

// DELETE /api/words/:id — admin only
words.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  await c.env.DB.prepare("DELETE FROM words WHERE id = ?")
    .bind(c.req.param("id"))
    .run();
  return c.json({ message: "Үг устгагдлаа" });
});

export default words;
