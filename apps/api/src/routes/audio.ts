import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { fetchEdgeTTS, jaSsmlBody } from "../lib/edgeTts";

import { limited } from "../lib/rateLimit";
const audio = new Hono<{ Bindings: Env; Variables: Variables }>();

const PHRASE_MAX = 320;

/** GET /api/audio/tts?text=…&speed=normal|slow — жишээ өгүүлбэр зэрэг бүтэн текстийг уншина */
audio.get("/tts", async (c) => {
  const text = (c.req.query("text") ?? "").trim();
  const speed = c.req.query("speed") === "slow" ? "slow" : "normal";

  if (!text || text.length > PHRASE_MAX) {
    return c.json({ error: "Текст хоосон эсвэл хэт урт байна" }, 400);
  }

  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);

  const cacheKey = `audio/phrase_${hash}_${speed}.mp3`;
  const cached = await c.env.STORAGE.get(cacheKey);
  if (cached) {
    return new Response(cached.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  }

  try {
    if (await limited(c, "tts-generate", 60, 600))
      return c.json(
        { error: "Дууг олон удаа үүсгэлээ. Түр хүлээгээд дахин сонсоно уу." },
        429,
      );
    const ssml = jaSsmlBody(text, speed);
    const audioBuffer = await fetchEdgeTTS(ssml, c.env);
    if (audioBuffer) {
      await c.env.STORAGE.put(cacheKey, audioBuffer, {
        httpMetadata: { contentType: "audio/mpeg" },
      });
      return new Response(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*",
          "Cross-Origin-Resource-Policy": "cross-origin",
        },
      });
    }
  } catch (e) {
    console.error("phrase TTS:", e);
  }

  return c.json(
    {
      error:
        "Серверийн япон дуу бэлэн биш байна. Төхөөрөмжийн япон дууг ашиглах эсвэл дараа дахин оролдоно уу.",
    },
    503,
  );
});

// GET /api/audio/:wordId?speed=normal|slow
audio.get("/:wordId", async (c) => {
  const wordId = c.req.param("wordId");
  const speed = c.req.query("speed") === "slow" ? "slow" : "normal";

  const cacheKey = `audio/${wordId}_${speed}.mp3`;

  const cached = await c.env.STORAGE.get(cacheKey);
  if (cached) {
    return new Response(cached.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  }

  const word = await c.env.DB.prepare(
    "SELECT kanji, kana, romaji FROM words WHERE id = ?",
  )
    .bind(wordId)
    .first<{ kanji: string; kana: string | null; romaji: string | null }>();

  if (!word) {
    return c.json({ error: "Үг олдсонгүй" }, 404);
  }

  const speakText = (
    word.kana?.trim() ||
    word.kanji?.trim() ||
    word.romaji?.trim() ||
    ""
  ).trim();

  try {
    if (await limited(c, "tts-generate", 60, 600))
      return c.json(
        { error: "Дууг олон удаа үүсгэлээ. Түр хүлээгээд дахин сонсоно уу." },
        429,
      );
    const ssml = jaSsmlBody(speakText, speed);
    const audioBuffer = await fetchEdgeTTS(ssml, c.env);

    if (audioBuffer) {
      await c.env.STORAGE.put(cacheKey, audioBuffer, {
        httpMetadata: { contentType: "audio/mpeg" },
      });

      await c.env.DB.prepare(
        `INSERT INTO audio_cache (word_id, audio_key, audio_url)
         VALUES (?, ?, ?)
         ON CONFLICT(word_id) DO UPDATE SET audio_key = excluded.audio_key, audio_url = excluded.audio_url`,
      )
        .bind(wordId, cacheKey, `/api/audio/${wordId}`)
        .run();

      return new Response(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*",
          "Cross-Origin-Resource-Policy": "cross-origin",
        },
      });
    }
  } catch (e) {
    console.error("TTS error:", e);
  }

  return c.json(
    {
      error:
        "Серверийн япон дуу бэлэн биш байна. Төхөөрөмжийн япон дууг ашиглах эсвэл дараа дахин оролдоно уу.",
    },
    503,
  );
});

export default audio;
