import dailyCourseRoutes from "./routes/course";
import speechAssessmentRoutes from "./routes/speechAssessment";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env, Variables } from "./types";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import wordRoutes from "./routes/words";
import audioRoutes from "./routes/audio";
import courseRoutes from "./routes/courses";
import gameRoutes from "./routes/games";
import cartoonRoutes from "./routes/cartoons";
import lessonRoutes from "./routes/lessons";
import grammarRoutes from "./routes/grammar";
import examRoutes from "./routes/exams";
import insightRoutes from "./routes/insights";
import { readingRouter } from "./routes/reading";
/** Explicit `./routes/admin/index` — do not use `./routes/admin`: a sibling `admin.ts` would shadow this folder and drop `/stats`, `/lesson-tree`, chapters, etc. */
import adminRoutes from "./routes/admin/index";
import { examImportApp } from "./routes/admin/examImportRoutes";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Middleware ──────────────────────────────────────────────
app.use("*", async (c, next) => {
  const incoming = c.req.header("X-Request-ID")?.trim();
  const requestId =
    incoming && /^[A-Za-z0-9._:-]{1,120}$/.test(incoming)
      ? incoming
      : crypto.randomUUID();

  c.set("requestId", requestId);
  c.header("X-Request-ID", requestId);
  await next();
});

app.use("*", logger());

function isAllowedOrigin(origin: string, env: Env): boolean {
  if (!origin) return false;
  const fromEnv = (env.CORS_ORIGIN ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const literals = new Set<string>([
    ...fromEnv,
    "http://localhost:5173", // Admin Vite dev
    "http://localhost:8081", // Expo web dev
    "http://localhost:8082", // Expo web (alternate)
    "http://localhost:8085", // Expo web dev (alternate port)
    "http://localhost:19000", // Expo / Metro web
    "http://localhost:19001",
    "http://localhost:19006", // Older Expo web port
    "exp://localhost:8081",
    "exp://localhost:8082",
  ]);
  if (literals.has(origin)) return true;
  // Preview must belong to the exact configured project, not the entire hosting zone.
  try {
    const candidate = new URL(origin);
    if (candidate.origin !== origin || candidate.protocol !== "https:")
      return false;
    for (const allowed of fromEnv) {
      const base = new URL(allowed);
      if (
        base.hostname.endsWith(".pages.dev") &&
        candidate.hostname.endsWith("." + base.hostname)
      )
        return true;
      if (
        base.hostname.endsWith(".workers.dev") &&
        candidate.hostname.endsWith("-" + base.hostname)
      )
        return true;
    }
  } catch {
    return false;
  }
  return false;
}

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      if (isAllowedOrigin(origin, c.env)) return origin;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposeHeaders: ["X-Request-ID"],
    credentials: true,
  }),
);

// ── Health check ────────────────────────────────────────────
app.get("/health", async (c) => {
  try {
    const tables = await c.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('course_events','course_settings','password_resets','request_limits')",
    ).all();
    await c.env.DB.prepare("SELECT auth_version FROM users LIMIT 1").first();
    if (tables.results.length !== 4) throw Error("Pending course migration");
    return c.json({ status: "ok", version: "1.2.0", course_schema: 4, release:c.env.BUILD_SHA??null });
  } catch {
    return c.json({ status: "migration_required", course_schema: 0 }, 503);
  }
});

// ── Routes ──────────────────────────────────────────────────
app.route("/api/auth", authRoutes);
app.route("/api/user/course", dailyCourseRoutes);
app.route("/api/user", userRoutes);
app.route("/api/words", wordRoutes);
app.route("/api/audio", audioRoutes);
app.route("/api/speech", speechAssessmentRoutes);
app.route("/api/courses", courseRoutes);
app.route("/api/games", gameRoutes);
app.route("/api/cartoons", cartoonRoutes);
app.route("/api/lessons", lessonRoutes);
app.route("/api/grammar", grammarRoutes);
app.route("/api/exams", examRoutes);
app.route("/api/insights", insightRoutes);
app.route("/api/reading", readingRouter);
app.route("/api/admin/exams", examImportApp);
app.route("/api/admin", adminRoutes);

// ── 404 handler ─────────────────────────────────────────────
app.notFound((c) =>
  c.json(
    {
      error: "Route олдсонгүй",
      code: "NOT_FOUND",
      request_id: c.get("requestId"),
    },
    404,
  ),
);

// ── Error handler ────────────────────────────────────────────
app.onError((err, c) => {
  const requestId = c.get("requestId");
  console.error(
    JSON.stringify({
      level: "error",
      request_id: requestId,
      method: c.req.method,
      path: c.req.path,
      message: err.message,
      stack: c.env.ENVIRONMENT === "production" ? undefined : err.stack,
    }),
  );
  return c.json(
    {
      error: "Серверт алдаа гарлаа",
      code: "INTERNAL_ERROR",
      request_id: requestId,
      ...(c.env.ENVIRONMENT === "production" ? {} : { detail: err.message }),
    },
    500,
  );
});

export default app;
