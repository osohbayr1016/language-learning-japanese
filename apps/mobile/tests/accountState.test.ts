import test from "node:test";
import assert from "node:assert/strict";
import { dailyGoalCacheKey, isCurrentAccountResult } from "../src/lib/auth/accountState";

function token(sub: number, nonce: number): string {
  const payload = btoa(JSON.stringify({ sub, nonce, exp: 9999999999 }))
    .replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  return "header." + payload + ".signature";
}
test("learner goal cache is isolated even across refreshed tokens", () => {
  assert.equal(dailyGoalCacheKey(token(1,1)), dailyGoalCacheKey(token(1,2)));
  assert.notEqual(dailyGoalCacheKey(token(1,1)), dailyGoalCacheKey(token(2,1)));
  assert.equal(dailyGoalCacheKey(null), "daily_xp_goal");
});
test("old dashboard results do not cross account or refresh boundaries", () => {
  const original = token(1,1);
  assert.equal(isCurrentAccountResult(original,original,3,3),true);
  assert.equal(isCurrentAccountResult(original,token(2,1),3,3),false);
  assert.equal(isCurrentAccountResult(original,token(1,2),3,3),false);
  assert.equal(isCurrentAccountResult(original,original,2,3),false);
  assert.equal(isCurrentAccountResult(original,null,3,3),false);
});
