import { signJWT, hashPassword, generateRefreshToken } from "./auth";

export const ACCESS_TOKEN_TTL = 60 * 15; // 15 minutes
export const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days

/** D1 may return INTEGER columns as number or bigint; bindings need a finite number. */
function toFiniteUserId(raw: unknown): number {
  if (typeof raw === "bigint") return Number(raw);
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  throw new Error("Invalid user id");
}

export type TokenUser = {
  id: unknown;
  email: string;
  is_admin: boolean;
  auth_version?: number;
};

export async function issueAccessToken(
  user: TokenUser,
  secret: string | undefined,
): Promise<string> {
  const sub = toFiniteUserId(user.id);
  return signJWT(
    {
      sub,
      ver: user.auth_version ?? 0,
      email: user.email,
      is_admin: user.is_admin,
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL,
    },
    secret ?? "",
  );
}

export async function issueRefreshToken(
  db: D1Database,
  userId: unknown,
): Promise<string> {
  const uid = toFiniteUserId(userId);
  const refresh_token = generateRefreshToken();
  const token_hash = await hashPassword(refresh_token);
  const expires_at = new Date(
    Date.now() + REFRESH_TOKEN_TTL * 1000,
  ).toISOString();
  await db
    .prepare(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    )
    .bind(uid, token_hash, expires_at)
    .run();
  return refresh_token;
}

export async function deleteRefreshToken(
  db: D1Database,
  token: string,
): Promise<void> {
  const token_hash = await hashPassword(token);
  await db
    .prepare("DELETE FROM refresh_tokens WHERE token_hash = ?")
    .bind(token_hash)
    .run();
}

export async function findRefreshTokenOwner(db: D1Database, token: string) {
  const token_hash = await hashPassword(token);
  return db
    .prepare(
      `SELECT rt.user_id, rt.expires_at, u.email, u.is_admin, u.auth_version
     FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id
     WHERE rt.token_hash = ?`,
    )
    .bind(token_hash)
    .first<{
      user_id: number;
      expires_at: string;
      email: string;
      is_admin: number;
      auth_version: number;
    }>();
}
