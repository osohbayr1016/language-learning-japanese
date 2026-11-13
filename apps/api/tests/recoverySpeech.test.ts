import test from "node:test";
import assert from "node:assert/strict";
import { database } from "./helpers/database";
import auth from "../src/routes/auth";
import course from "../src/routes/course";
import speech, { validJapaneseWav } from "../src/routes/speechAssessment";
import {
  createPasswordHash,
  hashPassword,
  verifyPassword,
} from "../src/lib/auth";
import { issueAccessToken, issueRefreshToken } from "../src/lib/tokens";
import { fetchEdgeTTS, jaSsmlBody } from "../src/lib/edgeTts";
const secret = "test-recovery-never-production";
function fixture() {
  const d = database();
  const env = {
    DB: d.db,
    JWT_SECRET: secret,
    ENVIRONMENT: "development",
    AUTH_MAIL_API_KEY: "test-provider",
    AUTH_MAIL_FROM: "test@example.test",
    APP_ORIGIN: "https://learning.example.test",
    SPEECH_KEY: "speech-test-key",
    SPEECH_REGION: "eastus",
  } as any;
  const call = (path: string, body: unknown) =>
    auth.request(
      "https://api.example.test" + path,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      env,
    );
  return { ...d, env, call };
}
function wav() {
  const bytes = new ArrayBuffer(16044);
  const v = new DataView(bytes);
  const put = (at: number, s: string) =>
    [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  put(0, "RIFF");
  v.setUint32(4, bytes.byteLength - 8, true);
  put(8, "WAVE");
  put(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  put(36, "data");
  v.setUint32(40, bytes.byteLength - 44, true);
  return bytes;
}
test("password KDF uses independent salts and still verifies legacy passwords", async () => {
  const a = await createPasswordHash("example-password"),
    b = await createPasswordHash("example-password");
  assert.notEqual(a, b);
  assert.ok(await verifyPassword("example-password", a));
  assert.equal(await verifyPassword("wrong", a), false);
  assert.ok(await verifyPassword("legacy", await hashPassword("legacy")));
});
test("recovery is single use, expires, hides account existence and revokes both access and refresh sessions", async () => {
  const f = fixture(),
    original = globalThis.fetch;
  let token = "",
    messages = 0;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://api.resend.com/emails");
    messages++;
    const mail = JSON.parse(String(init?.body));
    assert.deepEqual(mail.to, ["learner@example.test"]);
    const link = mail.text.match(/https:\/\/[^\s]+/)[0];
    token = new URL(link).searchParams.get("token")!;
    return Response.json({ id: "mail-test" });
  };
  try {
    f.sqlite
      .prepare("UPDATE users SET password_hash=? WHERE id=1")
      .run(await createPasswordHash("old-password"));
    const access = await issueAccessToken(
      { id: 1, email: "learner@example.test", is_admin: false },
      secret,
    );
    await issueRefreshToken(f.db as any, 1);
    const known = await f.call("/password-reset/request", {
        email: "learner@example.test",
      }),
      unknown = await f.call("/password-reset/request", {
        email: "missing@example.test",
      });
    assert.equal(known.status, 200);
    assert.deepEqual(await known.json(), await unknown.json());
    assert.equal(messages, 1);
    assert.equal(token.length, 64);
    const stored = f.sqlite
      .prepare("SELECT token_hash FROM password_resets")
      .get()!;
    assert.notEqual(stored.token_hash, token);
    assert.equal(
      (
        await f.call("/password-reset/confirm", {
          token,
          password: "new-password",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await f.call("/password-reset/confirm", {
          token,
          password: "other-password",
        })
      ).status,
      400,
    );
    assert.equal(
      f.sqlite.prepare("SELECT count(*) n FROM refresh_tokens").get()?.n,
      0,
    );
    const denied = await course.request(
      "https://test/",
      { headers: { Authorization: "Bearer " + access } },
      f.env,
    );
    assert.equal(denied.status, 401);
    const login = await f.call("/login", {
      email: "learner@example.test",
      password: "new-password",
    });
    assert.equal(login.status, 200);
    const credentials = ((await login.json()) as any).data;
    assert.equal(
      (
        await course.request(
          "https://test/",
          { headers: { Authorization: "Bearer " + credentials.access_token } },
          f.env,
        )
      ).status,
      200,
    );
    const expired = "a".repeat(64);
    f.sqlite
      .prepare(
        "INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES(?,1,?)",
      )
      .run(await hashPassword(expired), "2000-01-01T00:00:00.000Z");
    assert.equal(
      (
        await f.call("/password-reset/confirm", {
          token: expired,
          password: "not-accepted",
        })
      ).status,
      400,
    );
  } finally {
    globalThis.fetch = original;
    f.sqlite.close();
  }
});
test("unconfigured mail never pretends to send and auth throttles repeated attempts", async () => {
  const f = fixture();
  delete f.env.AUTH_MAIL_API_KEY;
  try {
    assert.equal(
      (
        await f.call("/password-reset/request", {
          email: "learner@example.test",
        })
      ).status,
      503,
    );
    for (let i = 0; i < 15; i++)
      assert.equal(
        (
          await f.call("/login", {
            email: "missing@example.test",
            password: "wrong-pass",
          })
        ).status,
        401,
      );
    assert.equal(
      (
        await f.call("/login", {
          email: "missing@example.test",
          password: "wrong-pass",
        })
      ).status,
      429,
    );
  } finally {
    f.sqlite.close();
  }
});
test("Japanese acoustic requests validate PCM and explicitly select ja-JP without pitch claims", async () => {
  const f = fixture(),
    original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async (input, init) => {
    requests++;
    assert.ok(String(input).includes("language=ja-JP"));
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Ocp-Apim-Subscription-Key"), "speech-test-key");
    const config = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(headers.get("Pronunciation-Assessment")!), (c) =>
          c.charCodeAt(0),
        ),
      ),
    );
    assert.equal(config.ReferenceText, "あい");
    assert.equal(config.EnableProsodyAssessment, undefined);
    return Response.json({
      RecognitionStatus: "Success",
      NBest: [
        {
          Display: "あい",
          AccuracyScore: 82,
          FluencyScore: 79,
          CompletenessScore: 100,
          PronScore: 84,
          Words: [{ Word: "あい", AccuracyScore: 82, ErrorType: "None" }],
        },
      ],
    });
  };
  try {
    assert.ok(validJapaneseWav(wav()));
    assert.equal(validJapaneseWav(new ArrayBuffer(100)), false);
    const invoke = (body: ArrayBuffer) =>
      speech.request(
        "https://test/assess?wordId=hiragana-01-w0",
        { method: "POST", body },
        f.env,
      );
    assert.equal((await invoke(new ArrayBuffer(100))).status, 400);
    assert.equal(requests, 0);
    assert.equal((await invoke(new ArrayBuffer(960045))).status, 413);
    const stereo = wav();
    new DataView(stereo).setUint16(22, 2, true);
    assert.equal((await invoke(stereo)).status, 400);
    const response = await invoke(wav());
    assert.equal(response.status, 200);
    const data = ((await response.json()) as any).data;
    assert.equal(data.locale, "ja-JP");
    assert.equal(data.accuracy, 82);
    assert.equal(data.pitchAssessed, false);
    assert.equal(requests, 1);
    assert.equal(
      f.sqlite.prepare("SELECT count(*) n FROM course_events").get()?.n,
      0,
    );
    globalThis.fetch = async () =>
      Response.json({ RecognitionStatus: "NoMatch" });
    assert.equal((await invoke(wav())).status, 422);
  } finally {
    globalThis.fetch = original;
    f.sqlite.close();
  }
});
test("Japanese TTS has no empty-key request and uses configured regional audio only", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    calls++;
    assert.ok(
      String(input).startsWith("https://eastus.tts.speech.microsoft.com/"),
    );
    assert.equal(
      new Headers(init?.headers).get("Ocp-Apim-Subscription-Key"),
      "test-key",
    );
    return new Response(new Uint8Array(200), {
      headers: { "Content-Type": "audio/mpeg" },
    });
  };
  try {
    assert.equal(await fetchEdgeTTS(jaSsmlBody("あい", "slow")), null);
    assert.equal(calls, 0);
    assert.equal(
      (
        await fetchEdgeTTS(jaSsmlBody("あい", "slow"), {
          SPEECH_KEY: "test-key",
          SPEECH_REGION: "eastus",
        })
      )?.byteLength,
      200,
    );
  } finally {
    globalThis.fetch = original;
  }
});
