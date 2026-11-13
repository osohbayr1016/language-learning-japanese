import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { limited } from "../lib/rateLimit";
import { WORDS } from "../../../../packages/curriculum/src";
const speech = new Hono<{ Bindings: Env; Variables: Variables }>();
export function validJapaneseWav(bytes: ArrayBuffer) {
  if (bytes.byteLength < 8044 || bytes.byteLength > 960044) return false;
  const view = new DataView(bytes);
  const str = (at: number, n: number) =>
    String.fromCharCode(...new Uint8Array(bytes, at, n));
  return (
    str(0, 4) === "RIFF" &&
    view.getUint32(4, true) === bytes.byteLength - 8 &&
    str(8, 4) === "WAVE" &&
    str(12, 4) === "fmt " &&
    view.getUint32(16, true) === 16 &&
    view.getUint16(20, true) === 1 &&
    view.getUint16(22, true) === 1 &&
    view.getUint32(24, true) === 16000 &&
    view.getUint32(28, true) === 32000 &&
    view.getUint16(32, true) === 2 &&
    (bytes.byteLength - 44) % 2 === 0 &&
    view.getUint16(34, true) === 16 &&
    str(36, 4) === "data" &&
    view.getUint32(40, true) === bytes.byteLength - 44
  );
}
speech.post("/assess", async (c) => {
  if (
    !c.env.SPEECH_KEY ||
    !c.env.SPEECH_REGION ||
    !/^[a-z0-9-]+$/.test(c.env.SPEECH_REGION)
  )
    return c.json(
      { error: "Авианы үнэлгээний үйлчилгээ одоогоор идэвхжээгүй." },
      503,
    );
  const word = WORDS.get(c.req.query("wordId") ?? "");
  if (!word) return c.json({ error: "Үнэлэх үг олдсонгүй." }, 400);
  if (await limited(c, "japanese-assessment", 8, 600))
    return c.json({ error: "Түр завсарлаад дахин үнэлүүлнэ үү." }, 429);
  const declared = Number(c.req.header("Content-Length") ?? 0);
  if (declared > 960044)
    return c.json({ error: "Бичлэг 30 секундээс урт байна." }, 413);
  const reader = c.req.raw.body?.getReader();
  if (!reader) return c.json({ error: "Бичлэг хоосон байна." }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 960044) {
        await reader.cancel();
        return c.json({ error: "Бичлэг 30 секундээс урт байна." }, 413);
      }
      chunks.push(value);
    }
  } catch {
    return c.json({ error: "Бичлэг бүрэн ирсэнгүй." }, 400);
  } finally {
    reader.releaseLock();
  }
  const combined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const bytes = combined.buffer;
  if (!validJapaneseWav(bytes))
    return c.json(
      { error: "0.25–30 секундийн 16 kHz mono PCM бичлэг шаардлагатай." },
      400,
    );
  const config = {
    ReferenceText: word.jp,
    GradingSystem: "HundredMark",
    Granularity: "Word",
    Dimension: "Comprehensive",
    EnableMiscue: true,
  };
  const encoded = btoa(
    String.fromCharCode(...new TextEncoder().encode(JSON.stringify(config))),
  );
  try {
    const response = await fetch(
      `https://${c.env.SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=ja-JP&format=detailed`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": c.env.SPEECH_KEY,
          "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
          "Pronunciation-Assessment": encoded,
          Accept: "application/json",
        },
        body: bytes,
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!response.ok)
      return c.json(
        {
          error:
            "Япон авианы үнэлгээ түр ажиллахгүй байна. Дараа дахин оролдоно уу.",
        },
        503,
      );
    const raw = (await response.json()) as any;
    const best = raw.NBest?.[0];
    const metrics = best?.PronunciationAssessment ?? best;
    const score = (value: unknown) =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 100
        ? value
        : null;
    if (
      raw.RecognitionStatus !== "Success" ||
      !metrics ||
      score(metrics.AccuracyScore) === null
    )
      return c.json(
        { error: "Тод яриа танигдсангүй. Чимээгүй газар дахин бичээрэй." },
        422,
      );
    return c.json({
      data: {
        provider: "azure",
        locale: "ja-JP",
        reference: word.jp,
        transcript: best.Display ?? raw.DisplayText ?? "",
        accuracy: score(metrics.AccuracyScore),
        fluency: score(metrics.FluencyScore),
        completeness: score(metrics.CompletenessScore),
        overall: score(metrics.PronScore),
        words: (best.Words ?? []).slice(0, 80).map((w: any) => ({
          word: String(w.Word ?? ""),
          accuracy: score((w.PronunciationAssessment ?? w).AccuracyScore),
          error: String((w.PronunciationAssessment ?? w).ErrorType ?? "None"),
        })),
        pitchAssessed: false,
      },
    });
  } catch {
    return c.json(
      { error: "Үнэлгээний холболт тасарлаа. Оноо бүртгээгүй." },
      503,
    );
  }
});
export default speech;
