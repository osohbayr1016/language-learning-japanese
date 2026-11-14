import test from "node:test";
import assert from "node:assert/strict";
import { makeRewardOutbox, rewardAccountFromToken } from "../src/lib/rewardOutbox";
import type { RewardStorage, PendingReward } from "../src/lib/rewardOutbox";

function memoryStorage() {
  const records = new Map<string, string>();
  const storage: RewardStorage = {
    getItem: async (key) => records.get(key) ?? null,
    setItem: async (key, value) => { records.set(key, value); },
    removeItem: async (key) => { records.delete(key); },
  };
  return { storage, records };
}
const game = (id: string): PendingReward => ({
  kind: "game", session_id: id, created_at: 100,
  body: {
    session_id: id, game_type: "match", score: 100,
    accuracy: 1, duration_seconds: 30, words_practiced: 5, xp_earned: 20,
  },
});
const study = (id: string): PendingReward => ({
  kind: "study", session_id: id, created_at: 100,
  body: {
    session_id: id, session_type: "flashcard", xp_earned: 10,
    results: [{ word_id: 1, ease_factor: 2.5, interval: 1, repetitions: 1, next_review: "2026-11-15T00:00:00Z" }],
  },
});
test("outbox survives recreated clients and keeps study/game records per account", async () => {
  const { storage } = memoryStorage();
  const first = makeRewardOutbox(storage);
  await first.put("1", game("game_00001"));
  await first.put("1", study("study_0001"));
  await first.put("2", game("game_00002"));
  const restarted = makeRewardOutbox(storage);
  assert.equal((await restarted.list("1")).length, 2);
  assert.deepEqual((await restarted.list("2")).map(x => x.session_id), ["game_00002"]);
  await restarted.remove("1", "game", "game_00001");
  assert.deepEqual((await restarted.list("1")).map(x => x.session_id), ["study_0001"]);
  assert.equal((await restarted.list("2")).length, 1);
});
test("concurrent uploads never overwrite another pending session", async () => {
  const { storage } = memoryStorage();
  const q = makeRewardOutbox(storage);
  await Promise.all(Array.from({length: 30}, (_, i) => q.put("1", game("game_" + String(i).padStart(8,"0")))));
  assert.equal((await q.list("1")).length, 30);
  await Promise.all(Array.from({length: 10}, (_, i) => q.remove("1","game","game_"+String(i).padStart(8,"0"))));
  assert.equal((await q.list("1")).length, 20);
});
test("idempotent same-ID retry accepts exact body but rejects conflicting evidence", async () => {
  const { storage } = memoryStorage();
  const q = makeRewardOutbox(storage);
  await q.put("1", game("game_00001"));
  await q.put("1", game("game_00001"));
  assert.equal((await q.list("1")).length, 1);
  const forged = game("game_00001");
  if (forged.kind === "game") forged.body.score = 999;
  await assert.rejects(q.put("1", forged), /Conflicting retry/);
  assert.equal((await q.list("1")).length, 1);
});
test("storage errors and corrupt payloads fail visibly rather than erasing evidence", async () => {
  const { storage, records } = memoryStorage();
  const q = makeRewardOutbox(storage);
  await q.put("1", game("game_00001"));
  const key = [...records.keys()][0];
  records.set(key, "{corrupt");
  await assert.rejects(q.list("1"));
  await assert.rejects(q.put("1", study("study_0001")));
  assert.equal(records.get(key), "{corrupt");
  await assert.rejects(q.list("invalid"));
});
test("JWT owner is account stable across token rotation and fails closed", () => {
  const payload = (sub: number) => {
    const value = btoa(JSON.stringify({sub, exp: 9999999999}));
    return "a." + value.replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_") + ".c";
  };
  assert.equal(rewardAccountFromToken(payload(42)), "42");
  assert.equal(rewardAccountFromToken(payload(314)), "314");
  assert.equal(rewardAccountFromToken("bad.token"), null);
  assert.equal(rewardAccountFromToken(null), null);
});
