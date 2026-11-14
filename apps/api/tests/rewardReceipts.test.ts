import test from "node:test";
import assert from "node:assert/strict";
import { database } from "./helpers/database";
import { issueAccessToken } from "../src/lib/tokens";
import user from "../src/routes/user";
import games from "../src/routes/games";
import { rewardKey, receiptStatement, canonicalRewardJson } from "../src/lib/rewardReceipts";

const secret = "reward-receipts-test-secret";
async function fixture() {
  const databaseFixture = database();
  const token = await issueAccessToken(
    { id: 1, email: "learner@example.test", is_admin: false }, secret
  );
  const env = { DB: databaseFixture.db, JWT_SECRET: secret, ENVIRONMENT: "development" } as any;
  const call = async (
    router: typeof user | typeof games,
    path: string,
    body: unknown,
  ) => {
    const response = await router.request("https://test" + path, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, env);
    return { status: response.status, body: await response.json() as any };
  };
  return { ...databaseFixture, call };
}
const progress = () => ({
  session_id: "study_session_0001",
  results: [{
    word_id: 1, ease_factor: 2.5, interval: 1, repetitions: 1,
    next_review: new Date(Date.now() + 86400000).toISOString(),
  }],
  xp_earned: 10,
  session_type: "flashcard",
});
const game = () => ({
  session_id: "game_session_0001",
  game_type: "match",
  score: 100, accuracy: 0.75, duration_seconds: 70,
  words_practiced: 8, xp_earned: 20,
});

test("a retried study submission awards XP and reviews exactly once", async () => {
  const f = await fixture();
  try {
    const body = progress();
    const first = await f.call(user, "/progress", body);
    const again = await f.call(user, "/progress", body);
    assert.equal(first.status, 200);
    assert.equal(first.body.data.xp_earned, 10);
    assert.equal(first.body.data.already_saved, false);
    assert.equal(again.status, 200);
    assert.deepEqual(again.body.data, { xp_earned: 0, already_saved: true });
    assert.equal(f.sqlite.prepare("SELECT total_xp FROM user_stats WHERE user_id=1").get()?.total_xp, 10);
    assert.equal(f.sqlite.prepare("SELECT total_reviews FROM user_stats WHERE user_id=1").get()?.total_reviews, 1);
    assert.equal(f.sqlite.prepare("SELECT xp_earned FROM user_daily_activity WHERE user_id=1").get()?.xp_earned, 10);
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM reward_receipts").get()?.n, 1);
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM user_word_progress WHERE user_id=1").get()?.n, 1);
    const conflicting = await f.call(user, "/progress", { ...body, xp_earned: 12 });
    assert.equal(conflicting.status, 409);
    assert.equal(f.sqlite.prepare("SELECT total_xp FROM user_stats WHERE user_id=1").get()?.total_xp, 10);
  } finally { f.sqlite.close(); }
});

test("a retried game session creates one record, XP credit and daily session", async () => {
  const f = await fixture();
  try {
    const body = game();
    const first = await f.call(games, "/session", body);
    const again = await f.call(games, "/session", body);
    assert.equal(first.status, 200);
    assert.equal(first.body.data.xp_earned, 20);
    assert.equal(again.status, 200);
    assert.equal(again.body.data.xp_earned, 0);
    assert.equal(again.body.data.already_saved, true);
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM game_sessions").get()?.n, 1);
    const stats = f.sqlite.prepare("SELECT total_xp,games_played FROM user_stats WHERE user_id=1").get();
    assert.equal(stats?.total_xp, 20);
    assert.equal(stats?.games_played, 1);
    const daily = f.sqlite.prepare("SELECT xp_earned,minutes_studied,sessions_count FROM user_daily_activity WHERE user_id=1").get();
    assert.equal(daily?.xp_earned, 20);
    assert.equal(daily?.minutes_studied, 1);
    assert.equal(daily?.sessions_count, 1);
    assert.equal((await f.call(games, "/session", { ...body, score: 105 })).status, 409);
  } finally { f.sqlite.close(); }
});

test("different users and reward kinds cannot share one another's receipts", async () => {
  const f = await fixture();
  try {
    const res = await f.call(games, "/session", game());
    assert.equal(res.status, 200);
    const gameKind = f.sqlite.prepare("SELECT kind FROM reward_receipts LIMIT 1").get();
    assert.equal(gameKind?.kind, "game");
    assert.equal((await f.call(user, "/progress", { ...progress(), session_id: game().session_id })).status, 200);
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM reward_receipts").get()?.n, 2);
  } finally { f.sqlite.close(); }
});

test("invalid words, inflated XP, unsupported games and fake accuracy cannot mint XP", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.call(user, "/progress", {
      ...progress(), results: [{ ...progress().results[0], word_id: 987654321 }],
    })).status, 400);
    assert.equal((await f.call(user, "/progress", { ...progress(), xp_earned: 500 })).status, 400);
    assert.equal((await f.call(games, "/session", { ...game(), game_type: "nonsense" })).status, 400);
    assert.equal((await f.call(games, "/session", { ...game(), accuracy: 75 })).status, 400);
    assert.equal((await f.call(games, "/session", { ...game(), xp_earned: 100 })).status, 400);
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM reward_receipts").get()?.n, 0);
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM game_sessions").get()?.n, 0);
  } finally { f.sqlite.close(); }
});

test("pre-upgrade clients without session IDs deduplicate an identical same-day retry", async () => {
  const f = await fixture();
  try {
    const { session_id: _unused, ...oldBody } = game();
    assert.equal((await f.call(games, "/session", oldBody)).status, 200);
    const replay = await f.call(games, "/session", oldBody);
    assert.equal(replay.body.data.already_saved, true);
    assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM reward_receipts").get()?.n, 1);
  } finally { f.sqlite.close(); }
});

test("semantic key order does not change the reward fingerprint", async () => {
  assert.equal(canonicalRewardJson({b: 3, a: { y: 1, x: 2}}),
    canonicalRewardJson({a: { x: 2, y: 1}, b: 3}));
  const a = await rewardKey("game", {
    session_id: "test_session_1001", game_type: "match", score: 100,
    nested: {a: 1, b: 2},
  });
  const b = await rewardKey("game", {
    nested: {b: 2, a: 1}, score: 100, game_type: "match",
    session_id: "test_session_1001",
  });
  assert.deepEqual(a, b);
});

test("database guard rolls back simultaneous conflicting study writes", async () => {
  const f = database();
  try {
    const { db, sqlite } = f;
    await db.batch([
      receiptStatement(db as any, 1, "study", "same_session_1001", "original", 10, 1),
    ]);
    const prior = sqlite.prepare("SELECT total_xp FROM user_stats WHERE user_id=1").get()?.total_xp;
    await assert.rejects(
      db.batch([
        db.prepare("UPDATE user_stats SET words_learned=1000 WHERE user_id=1"),
        receiptStatement(db as any, 1, "study", "same_session_1001", "different", 30, 4),
      ]),
      /reward_receipt_payload_conflict/,
    );
    assert.equal(sqlite.prepare("SELECT words_learned FROM user_stats WHERE user_id=1").get()?.words_learned, 0);
    assert.equal(sqlite.prepare("SELECT total_xp FROM user_stats WHERE user_id=1").get()?.total_xp, prior);
    assert.equal(sqlite.prepare("SELECT count(*) AS n FROM reward_receipts").get()?.n, 1);
  } finally { f.sqlite.close(); }
});
