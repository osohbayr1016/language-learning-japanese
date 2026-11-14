export type RewardKind = "study" | "game";
export type Receipt = { request_hash: string; xp_earned: number };

export function validSessionId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(id);
}

/** Hash normalized content rather than trusting a caller-provided fingerprint. */
export async function rewardKey(
  kind: RewardKind,
  body: Record<string, unknown>,
): Promise<{ sessionId: string; hash: string }> {
  const { session_id: _ignored, ...payload } = body;
  const bytes = new TextEncoder().encode(JSON.stringify({ kind, payload }));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
  // Pre-upgrade native clients do not send IDs. Coalesce exact same-day retries
  // rather than inventing a fresh ID each time (which would double award XP).
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const sessionId = validSessionId(body.session_id)
    ? body.session_id
    : "legacy_" + day + "_" + hash.slice(0, 48);
  return { sessionId, hash };
}

export async function findReceipt(
  db: D1Database,
  userId: number,
  kind: RewardKind,
  sessionId: string,
): Promise<Receipt | null> {
  return db.prepare(
    "SELECT request_hash, xp_earned FROM reward_receipts WHERE user_id=? AND kind=? AND session_id=?",
  ).bind(userId, kind, sessionId).first<Receipt>();
}

export function receiptStatement(
  db: D1Database,
  userId: number,
  kind: RewardKind,
  sessionId: string,
  hash: string,
  xp: number,
  reviewCount = 0,
  gameSeconds = 0,
): D1PreparedStatement {
  return db.prepare(
    `INSERT INTO reward_receipts
      (user_id,kind,session_id,request_hash,xp_earned,review_count,game_seconds)
     VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,kind,session_id) DO NOTHING`,
  ).bind(userId, kind, sessionId, hash, xp, reviewCount, gameSeconds);
}
