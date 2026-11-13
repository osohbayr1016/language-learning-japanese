import type { Context } from "hono";
import type { Env, Variables } from "../types";
export async function limited(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  name: string,
  max: number,
  seconds: number,
) {
  const ip = c.req.header("CF-Connecting-IP") ?? "local";
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip),
  );
  const hash = Array.from(new Uint8Array(bytes))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare("DELETE FROM request_limits WHERE expires_at<=?")
    .bind(now)
    .run();
  const row = await c.env.DB.prepare(
    `INSERT INTO request_limits(bucket_key,hits,expires_at) VALUES(?,1,?)
    ON CONFLICT(bucket_key) DO UPDATE SET hits=CASE WHEN expires_at<=? THEN 1 ELSE hits+1 END,
    expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING hits,expires_at`,
  )
    .bind(name + ":" + hash, now + seconds, now, now)
    .first<{ hits: number; expires_at: number }>();
  if (!row) throw Error("Rate limit storage unavailable");
  if (row.hits > max) {
    c.header("Retry-After", String(Math.max(1, row.expires_at - now)));
    return true;
  }
  return false;
}
