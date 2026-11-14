import test from "node:test";
import assert from "node:assert/strict";
import { tokensBelongToSameLearner, canContinueRefresh } from "../src/lib/auth/sessionOwnership";

function jwt(sub: number, exp = 123): string {
  return "header." + btoa(JSON.stringify({ sub, exp }))
    .replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_") + ".sig";
}
test("a rotated access token can refresh only for the same learner", () => {
  const oldA = jwt(1, 100);
  const rotatedA = jwt(1, 200);
  const tokenB = jwt(2);
  assert.equal(tokensBelongToSameLearner(oldA, rotatedA), true);
  assert.equal(tokensBelongToSameLearner(oldA, tokenB), false);
  assert.equal(tokensBelongToSameLearner(oldA, null), false);
  assert.equal(tokensBelongToSameLearner("bad", rotatedA), false);
});
test("refresh cannot continue after logout or credential switch", () => {
  const oldA = jwt(1, 100);
  const newA = jwt(1, 200);
  const b = jwt(2);
  assert.equal(canContinueRefresh(oldA, newA, "refresh_A", "refresh_A"), true);
  assert.equal(canContinueRefresh(oldA, newA, "refresh_A", null), false);
  assert.equal(canContinueRefresh(oldA, b, "refresh_A", "refresh_B"), false);
  assert.equal(canContinueRefresh(oldA, b, "refresh_A", "refresh_A"), false);
  assert.equal(canContinueRefresh(oldA, null, "refresh_A", "refresh_A"), false);
  assert.equal(canContinueRefresh(oldA, newA, "refresh_A", "refresh_B"), false);
});
