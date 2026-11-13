import { Hono } from "hono";
import {
  createPasswordHash,
  hashPassword,
  verifyPassword,
  generateRefreshToken,
} from "../lib/auth";
import {
  ACCESS_TOKEN_TTL,
  deleteRefreshToken,
  findRefreshTokenOwner,
  issueAccessToken,
  issueRefreshToken,
} from "../lib/tokens";
import type { Env, Variables } from "../types";
import type { LoginRequest, RegisterRequest } from "@japanese-learning/types";
import { userIsAdminFromDb } from "../lib/userIsAdminFromDb";
import { jsonBodyInvalid, readJsonBody } from "../lib/requestJson";

import { limited } from "../lib/rateLimit";
const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

auth.post("/register", async (c) => {
  if (await limited(c, "register", 5, 3600))
    return c.json({ error: "Түр хүлээгээд дахин оролдоно уу." }, 429);
  const body = await readJsonBody<RegisterRequest>(c);
  if (!body) return jsonBodyInvalid(c);

  const pwd =
    typeof body.password === "string"
      ? body.password
      : String(body.password ?? "");
  const displayNameRaw =
    typeof body.display_name === "string"
      ? body.display_name
      : String(body.display_name ?? "");

  if (!body.email || !pwd || !displayNameRaw) {
    return c.json({ error: "Бүх талбарыг бөглөнө үү" }, 400);
  }
  if (pwd.length < 8 || pwd.length > 256) {
    return c.json({ error: "Нууц үг дор хаяж 8 тэмдэгт байх ёстой" }, 400);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return c.json({ error: "Имэйл хаягаа шалгана уу." }, 400);
  if (!email) {
    return c.json({ error: "Имэйл оруулна уу" }, 400);
  }
  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ?",
  )
    .bind(email)
    .first();
  if (existing) {
    return c.json({ error: "Энэ имэйл хаяг бүртгэлтэй байна" }, 409);
  }

  const password_hash = await createPasswordHash(pwd);
  const displayName = displayNameRaw.trim();
  if (!displayName) {
    return c.json({ error: "Нэрээ оруулна уу" }, 400);
  }
  const result = await c.env.DB.prepare(
    `INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?) RETURNING id`,
  )
    .bind(email, password_hash, displayName)
    .first<{ id: number }>();

  if (!result) return c.json({ error: "Бүртгэл үүсгэхэд алдаа гарлаа" }, 500);

  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO user_streaks (user_id) VALUES (?)").bind(
      result.id,
    ),
    c.env.DB.prepare("INSERT INTO user_stats (user_id) VALUES (?)").bind(
      result.id,
    ),
  ]);

  const access_token = await issueAccessToken(
    { id: result.id, email, is_admin: false },
    c.env.JWT_SECRET,
  );
  const refresh_token = await issueRefreshToken(c.env.DB, result.id);

  return c.json(
    {
      data: { access_token, refresh_token, expires_in: ACCESS_TOKEN_TTL },
      message: "Бүртгэл амжилттай үүслээ",
    },
    201,
  );
});

auth.post("/login", async (c) => {
  if (await limited(c, "login", 15, 300))
    return c.json({ error: "Олон удаа оролдлоо. Түр хүлээнэ үү." }, 429);
  const body = await readJsonBody<LoginRequest>(c);
  if (!body) return jsonBodyInvalid(c);
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password =
    typeof body.password === "string"
      ? body.password
      : String(body.password ?? "");
  if (!email || !password || password.length > 256) {
    return c.json({ error: "Имэйл болон нууц үгээ оруулна уу" }, 400);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, password_hash, is_admin, display_name, auth_version FROM users WHERE email = ?",
  )
    .bind(email)
    .first<{
      id: number;
      email: string;
      password_hash: string;
      is_admin: number;
      display_name: string;
      auth_version: number;
    }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    const dev = (c.env.ENVIRONMENT ?? "").toLowerCase() === "development";
    return c.json(
      {
        error: "Имэйл эсвэл нууц үг буруу байна",
        ...(dev
          ? {
              hint: "Эхний удаа эндээ бүртгэл байхгүй байж болно. POST /api/auth/register эсвэл апп-аар бүртгүүлээд дахин оролдоно уу. Админ самбарт зориулж D1 дээр users.is_admin = 1 тохируулна.",
            }
          : {}),
      },
      401,
    );
  }

  if (!user.password_hash.startsWith("pbkdf2$"))
    await c.env.DB.prepare(
      "UPDATE users SET password_hash=? WHERE id=? AND password_hash=? AND auth_version=?",
    )
      .bind(
        await createPasswordHash(password),
        user.id,
        user.password_hash,
        user.auth_version,
      )
      .run();

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT OR IGNORE INTO user_streaks (user_id) VALUES (?)",
    ).bind(user.id),
    c.env.DB.prepare(
      "INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)",
    ).bind(user.id),
  ]);

  const access_token = await issueAccessToken(
    {
      id: user.id,
      email: user.email,
      is_admin: userIsAdminFromDb(user.is_admin),
      auth_version: user.auth_version,
    },
    c.env.JWT_SECRET,
  );
  const refresh_token = await issueRefreshToken(c.env.DB, user.id);

  return c.json({
    data: { access_token, refresh_token, expires_in: ACCESS_TOKEN_TTL },
  });
});

auth.post("/refresh", async (c) => {
  const body = await readJsonBody<{ refresh_token: string }>(c);
  if (!body) return jsonBodyInvalid(c);
  if (!body.refresh_token) {
    return c.json({ error: "Refresh token шаардлагатай" }, 400);
  }

  const stored = await findRefreshTokenOwner(c.env.DB, body.refresh_token);
  if (!stored) return c.json({ error: "Token хүчингүй" }, 401);

  if (new Date(stored.expires_at) < new Date()) {
    await deleteRefreshToken(c.env.DB, body.refresh_token);
    return c.json({ error: "Token хугацаа дууссан" }, 401);
  }

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT OR IGNORE INTO user_streaks (user_id) VALUES (?)",
    ).bind(stored.user_id),
    c.env.DB.prepare(
      "INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)",
    ).bind(stored.user_id),
  ]);

  const access_token = await issueAccessToken(
    {
      id: stored.user_id,
      email: stored.email,
      is_admin: userIsAdminFromDb(stored.is_admin),
      auth_version: stored.auth_version,
    },
    c.env.JWT_SECRET,
  );

  return c.json({ data: { access_token, expires_in: ACCESS_TOKEN_TTL } });
});

auth.post("/logout", async (c) => {
  const body = await readJsonBody<{ refresh_token: string }>(c);
  if (!body) return jsonBodyInvalid(c);
  if (body.refresh_token) {
    await deleteRefreshToken(c.env.DB, body.refresh_token);
  }
  return c.json({ message: "Амжилттай гарлаа" });
});

auth.get("/capabilities", (c) =>
  c.json({
    data: {
      passwordReset: !!(
        c.env.AUTH_MAIL_API_KEY &&
        c.env.AUTH_MAIL_FROM &&
        c.env.APP_ORIGIN
      ),
      acousticAssessment: !!(c.env.SPEECH_KEY && c.env.SPEECH_REGION),
    },
  }),
);
auth.post("/password-reset/request", async (c) => {
  if (await limited(c, "password-reset", 5, 3600))
    return c.json({ error: "Түр хүлээгээд дахин оролдоно уу." }, 429);
  if (!c.env.AUTH_MAIL_API_KEY || !c.env.AUTH_MAIL_FROM || !c.env.APP_ORIGIN)
    return c.json(
      {
        error:
          "Имэйлээр сэргээх үйлчилгээ одоогоор идэвхжээгүй. Админтай холбогдоно уу.",
      },
      503,
    );
  const body = await c.req.json<{ email?: unknown }>().catch(() => null);
  if (typeof body?.email !== "string" || body.email.length > 254)
    return c.json({ error: "Имэйл хаягаа шалгана уу." }, 400);
  const email = body.email.trim().toLowerCase();
  const user = await c.env.DB.prepare("SELECT id FROM users WHERE email=?")
    .bind(email)
    .first<{ id: number }>();
  if (user) {
    const origin = new URL(c.env.APP_ORIGIN);
    if (origin.protocol !== "https:" && c.env.ENVIRONMENT !== "development")
      throw Error("APP_ORIGIN must use HTTPS");
    const token = generateRefreshToken();
    const hash = await hashPassword(token);
    const expires = new Date(Date.now() + 1800000).toISOString();
    await c.env.DB.prepare(
      "INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES(?,?,?)",
    )
      .bind(hash, user.id, expires)
      .run();
    const link = new URL("/reset-password", origin.origin);
    link.searchParams.set("token", token);
    try {
      const sent = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + c.env.AUTH_MAIL_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": hash,
        },
        body: JSON.stringify({
          from: c.env.AUTH_MAIL_FROM,
          to: [email],
          subject: "Nihongo · Нууц үгээ сэргээх",
          text: `Нууц үгээ шинэчлэх холбоос 30 минут хүчинтэй. Та хүсэлт гаргаагүй бол энэ имэйлийг үл тооно уу.\n\n${link.href}`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!sent.ok)
        console.error("Password reset mail delivery failed", sent.status);
    } catch {
      console.error("Password reset mail delivery unavailable");
    }
  }
  return c.json({
    message:
      "Энэ хаяг бүртгэлтэй бол сэргээх холбоос илгээгдэнэ. Спам хавтсаа бас шалгаарай.",
  });
});
auth.post("/password-reset/confirm", async (c) => {
  if (await limited(c, "password-reset-confirm", 10, 3600))
    return c.json({ error: "Түр хүлээгээд дахин оролдоно уу." }, 429);
  const body = await c.req
    .json<{ token?: unknown; password?: unknown }>()
    .catch(() => null);
  if (
    typeof body?.token !== "string" ||
    !/^[a-f0-9]{64}$/.test(body.token) ||
    typeof body.password !== "string" ||
    body.password.length < 8 ||
    body.password.length > 256
  )
    return c.json({ error: "Холбоос болон нууц үгээ шалгана уу." }, 400);
  const hash = await hashPassword(body.token),
    now = new Date().toISOString();
  const passwordHash = await createPasswordHash(body.password);
  const statements = [
    c.env.DB.prepare(
      "UPDATE users SET password_hash=?,auth_version=auth_version+1 WHERE id IN (SELECT user_id FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>?)",
    ).bind(passwordHash, hash, now),
    c.env.DB.prepare(
      "DELETE FROM refresh_tokens WHERE user_id IN (SELECT user_id FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>?)",
    ).bind(hash, now),
    c.env.DB.prepare(
      "UPDATE password_resets SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>?",
    ).bind(now, hash, now),
  ];
  const results = await c.env.DB.batch(statements);
  if (!results[0]?.meta.changes)
    return c.json(
      {
        error:
          "Холбоос ашиглагдсан эсвэл хугацаа нь дууссан. Шинээр хүсэлт гаргана уу.",
      },
      400,
    );
  return c.json({ message: "Нууц үг шинэчлэгдлээ. Дахин нэвтэрнэ үү." });
});
export default auth;
