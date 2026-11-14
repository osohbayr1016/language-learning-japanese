import test from "node:test";
import assert from "node:assert/strict";
import { newSessionId } from "../src/lib/sessionIds";
test("native-compatible session IDs are valid deduplication keys", () => {
  const ids = Array.from({ length: 10 }, () => newSessionId());
  assert.equal(new Set(ids).size, 10);
  ids.forEach((id) => assert.match(id, /^[A-Za-z0-9_-]{8,100}$/));
});
