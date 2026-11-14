import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import type { Env, Variables } from "../types";
import {
  DEFAULT_PREFERENCES,
  dailyLessonPlan,
  validPreferences,
  validateEvent,
  canStudy,
  mergeEvents,
  type CourseEvent,
} from "../../../../packages/curriculum/src";
/** Event identity includes the payload, independent of JSON object key ordering. */
function canonicalEvent(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonicalEvent).join(",") + "]";
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return "{" + Object.keys(object).sort().map(key => JSON.stringify(key) + ":" + canonicalEvent(object[key])).join(",") + "}";
  }
  return JSON.stringify(value) ?? "null";
}
const course = new Hono<{ Bindings: Env; Variables: Variables }>();
course.use("*", authMiddleware);
course.get("/", async (c) => {
  const { sub } = c.get("user");
  const rawAfter = c.req.query("after");
  if (rawAfter !== undefined &&
      (!/^[0-9]+$/.test(rawAfter) || !Number.isSafeInteger(Number(rawAfter))))
    return c.json({ error: "Буруу явцын cursor" }, 400);
  const after = rawAfter === undefined ? 0 : Number(rawAfter);
  const rows = await c.env.DB.prepare(
    "SELECT rowid AS cursor, payload FROM course_events WHERE user_id=? AND rowid>? ORDER BY rowid LIMIT 500",
  )
    .bind(sub, after)
    .all<{ cursor: number; payload: string }>();
  const setting = await c.env.DB.prepare(
    "SELECT preferences FROM course_settings WHERE user_id=?",
  )
    .bind(sub)
    .first<{ preferences: string }>();
  return c.json({
    data: {
      events: rows.results.map((r) => JSON.parse(r.payload)),
      cursor: rows.results.at(-1)?.cursor ?? after,
      hasMore: rows.results.length === 500,
      preferences: setting
        ? JSON.parse(setting.preferences)
        : DEFAULT_PREFERENCES,
    },
  });
});
course.get("/plan", async (c) => {
  const { sub } = c.get("user");
  const [rows, setting] = await Promise.all([
    c.env.DB.prepare(
      "SELECT payload FROM course_events WHERE user_id=? AND json_extract(payload,'$.kind')!='study' ORDER BY rowid",
    )
      .bind(sub)
      .all<{ payload: string }>(),
    c.env.DB.prepare("SELECT preferences FROM course_settings WHERE user_id=?")
      .bind(sub)
      .first<{ preferences: string }>(),
  ]);
  const events = rows.results.map(
    (row) => JSON.parse(row.payload) as CourseEvent,
  );
  const preferences = setting
    ? JSON.parse(setting.preferences)
    : DEFAULT_PREFERENCES;
  return c.json({ data: dailyLessonPlan(events, preferences) });
});
course.post("/events", async (c) => {
  const { sub } = c.get("user");
  const raw = await c.req.text();
  if (raw.length > 200000) return c.json({ error: "Хүсэлт хэт том" }, 413);
  let body: { events?: unknown[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return c.json({ error: "Буруу JSON" }, 400);
  }
  if (
    !body || typeof body !== "object" ||
    !Array.isArray(body.events) ||
    body.events.length > 100 ||
    !body.events.every(validateEvent)
  )
    return c.json({ error: "Буруу сургалтын үйл явдал" }, 400);
  const incoming = body.events as CourseEvent[];
  const unique = new Map<string, string>();
  for (const event of incoming) {
    const encoded = canonicalEvent(event);
    const prior = unique.get(event.id);
    if (prior !== undefined && prior !== encoded)
      return c.json({ error: "Нэг ID-д зөрүүтэй сургалтын нотолгоо илгээгдсэн" }, 409);
    unique.set(event.id, encoded);
  }

  // Check every incoming ID, not only task/placement events. A reconnect must
  // never silently accept conflicting evidence under an existing event ID.
  const existingIds = new Set<string>();
  if (unique.size) {
    const ids = [...unique.keys()];
    const stored = await c.env.DB.prepare(
      `SELECT event_id,payload FROM course_events WHERE user_id=? AND event_id IN (${ids.map(() => '?').join(',')})`,
    ).bind(sub, ...ids).all<{ event_id: string; payload: string }>();
    for (const event of stored.results) {
      existingIds.add(event.event_id);
      if (canonicalEvent(JSON.parse(event.payload)) !== unique.get(event.event_id))
        return c.json({ error: "Энэ үйл явдлын ID өөр өгөгдөлтэй байна" }, 409);
    }
  }

  const rows = await c.env.DB.prepare(
    "SELECT payload FROM course_events WHERE user_id=? AND json_extract(payload, '$.kind') IN ('task','placement') ORDER BY rowid",
  )
    .bind(sub)
    .all<{ payload: string }>();
  const current = rows.results.map((r) => JSON.parse(r.payload) as CourseEvent);
  let prior = current;
  // Validate prerequisites before accepting new lesson evidence. Existing duplicates are harmless.
  for (const e of [...incoming].sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  )) {
    if (
      !existingIds.has(e.id) &&
      (e.kind === "task" ||
        e.kind === "attempt" ||
        e.kind === "remedy" ||
        e.kind === "plan") &&
      !canStudy(prior, e.lessonId)
    )
      return c.json({ error: "Өмнөх хичээлээ эхлээд дуусгана уу." }, 409);
    prior = mergeEvents(prior, [e]);
  }
  if (incoming.length)
    await c.env.DB.batch(
      incoming.map((e) =>
        c.env.DB.prepare(
          "INSERT OR IGNORE INTO course_events(user_id,event_id,payload) VALUES(?,?,?)",
        ).bind(sub, e.id, JSON.stringify(e)),
      ),
    );
  return c.json({ ok: true, accepted: incoming.map((e) => e.id) });
});
course.put("/preferences", async (c) => {
  const { sub } = c.get("user");
  const body = await c.req.json().catch(() => null);
  if (!validPreferences(body)) return c.json({ error: "Буруу тохиргоо" }, 400);
  await c.env.DB.prepare(
    "INSERT INTO course_settings(user_id,preferences) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET preferences=excluded.preferences,updated_at=CURRENT_TIMESTAMP",
  )
    .bind(sub, JSON.stringify(body))
    .run();
  return c.json({ ok: true });
});
export default course;
