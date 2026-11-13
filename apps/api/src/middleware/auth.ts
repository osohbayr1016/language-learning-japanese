import { createMiddleware } from "hono/factory";
import { verifyJWT } from "../lib/auth";
import { fetchUserSession } from "../lib/authSession";
import type { Env, Variables } from "../types";

export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const authorization = c.req.header("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return c.json({ error: "Нэвтрэх шаардлагатай", code: "UNAUTHORIZED" }, 401);
  }

  const token = authorization.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json(
      { error: "Token хүчингүй болсон", code: "TOKEN_EXPIRED" },
      401,
    );
  }

  const session = await fetchUserSession(c.env.DB, payload.sub);
  if (!session || (payload.ver ?? 0) !== session.auth_version) {
    return c.json({ error: "Хэрэглэгч олдсонгүй", code: "UNAUTHORIZED" }, 401);
  }

  c.set("user", {
    ...payload,
    sub: session.id,
    email: session.email,
    is_admin: session.is_admin,
  });
  await next();
});

export const adminMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const user = c.get("user");
  if (!user?.is_admin) {
    return c.json(
      { error: "Admin эрх шаардлагатай (is_admin=1)", code: "FORBIDDEN" },
      403,
    );
  }
  await next();
});
