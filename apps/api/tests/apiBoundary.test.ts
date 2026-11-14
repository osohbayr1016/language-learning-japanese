import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/index";
import userRoutes from "../src/routes/user";
import wordsRoutes from "../src/routes/words";
import gamesRoutes from "../src/routes/games";
import { issueAccessToken } from "../src/lib/tokens";
import { database } from "./helpers/database";
import { boundedInteger, positiveId } from "../src/lib/queryNumbers";
import { validStudyProgressBody } from "../src/lib/validateStudyProgress";

test("query parser rejects invalid integers and bounds large page sizes", () => {
  assert.equal(boundedInteger("NaN", 20, 1, 100), 20);
  assert.equal(boundedInteger("-5", 20, 1, 100), 20);
  assert.equal(boundedInteger("Infinity", 20, 1, 100), 20);
  assert.equal(boundedInteger("500000", 20, 1, 100), 100);
  assert.equal(boundedInteger("0", 20, 1, 100), 1);
  assert.equal(positiveId("1e4"), null);
  assert.equal(positiveId("3.5"), null);
  assert.equal(positiveId("42"), 42);
});

test("study validation blocks forged XP, invalid dates and duplicate words", () => {
  const row = { word_id: 1, ease_factor: 2.5, interval: 1, repetitions: 1, next_review: "2026-11-15T00:00:00Z" };
  const good = { results: [row], xp_earned: 10, session_type: "flashcard" };
  assert.equal(validStudyProgressBody(good), true);
  assert.equal(validStudyProgressBody({ ...good, xp_earned: 1000000 }), false);
  assert.equal(validStudyProgressBody({ ...good, results: [row, row] }), false);
  assert.equal(validStudyProgressBody({ ...good, results: [{ ...row, next_review: "bad" }] }), false);
  assert.equal(validStudyProgressBody({ ...good, results: "not-an-array" }), false);
});

test("CORS includes PATCH for the authenticated flashcard eligibility operation", async () => {
  const origin = "https://nihongo.example.test";
  const response = await app.request(
    "https://api.example.test/api/user/vocabulary/42/eligibility",
    { method: "OPTIONS", headers: {
      Origin: origin,
      "Access-Control-Request-Method": "PATCH",
      "Access-Control-Request-Headers": "Authorization,Content-Type",
    } },
    { CORS_ORIGIN: origin } as any,
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /PATCH/);
});

test("invalid study and game submissions return 400 without changing XP or progress", async () => {
  const f = database();
  const secret = "api-boundary-test-only-secret";
  const token = await issueAccessToken({ id: 1, email: "learner@example.test", is_admin: false }, secret);
  const env = { DB: f.db, JWT_SECRET: secret, ENVIRONMENT: "development" } as any;
  const post = (router: typeof userRoutes | typeof gamesRoutes, path: string, body: unknown) =>
    router.request("https://api.example.test" + path, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, env);
  try {
    const badProgress = await post(userRoutes, "/progress", { results: [], xp_earned: 999999, session_type: "flashcard" });
    assert.equal(badProgress.status, 400);
    const badGame = await post(gamesRoutes, "/session", {
      game_type: "match", score: 500, accuracy: 100, duration_seconds: -1,
      words_practiced: 1, xp_earned: 1000000,
    });
    assert.equal(badGame.status, 400);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM game_sessions").get()?.n, 0);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM user_word_progress").get()?.n, 0);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM user_daily_activity").get()?.n, 0);
  } finally { f.sqlite.close(); }
});

test("word pagination and due queries never forward malformed limits into D1", async () => {
  const f = database();
  const secret = "api-boundary-test-only-secret";
  const token = await issueAccessToken({ id: 1, email: "learner@example.test", is_admin: false }, secret);
  const env = { DB: f.db, JWT_SECRET: secret, ENVIRONMENT: "development" } as any;
  try {
    const page = await wordsRoutes.request("http://test/?limit=NaN&offset=-1", {}, env);
    assert.equal(page.status, 200);
    const data = await page.json() as any;
    assert.equal(data.limit, 50);
    assert.equal(data.page, 1);
    assert.equal((await wordsRoutes.request("http://test/?jlpt=NaN", {}, env)).status, 400);
    const due = await userRoutes.request("http://test/due-words?limit=Infinity",
      { headers: { Authorization: "Bearer " + token } }, env);
    assert.equal(due.status, 200);
  } finally { f.sqlite.close(); }
});
