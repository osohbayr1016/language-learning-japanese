import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { database } from "./helpers/database";
import { issueAccessToken } from "../src/lib/tokens";
import games from "../src/routes/games";
import user from "../src/routes/user";
import words from "../src/routes/words";

test("rebuilding the game table keeps old IDs, rows and indexes", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  const dir = new URL("../migrations/", import.meta.url);
  const migrations = readdirSync(dir).filter(name => name.endsWith(".sql")).sort();
  try {
    for (const file of migrations.filter(name => !name.startsWith("0037_"))) {
      db.exec(readFileSync(new URL(file, dir), "utf8"));
    }
    db.exec("INSERT INTO users(id,email,password_hash,display_name) VALUES(123,'historical@example.test','test','Historical')");
    db.exec("INSERT INTO game_sessions (id,user_id,game_type,score,accuracy,duration_seconds,words_practiced,xp_earned) VALUES (321,123,'speed_match',35,0.8,45,5,7)");
    db.exec(readFileSync(new URL("0037_game_session_compatibility.sql",dir),"utf8"));
    assert.equal(db.prepare("SELECT game_type FROM game_sessions WHERE id=321").get()?.game_type, "speed_match");
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal(db.prepare("PRAGMA integrity_check").get()?.integrity_check, "ok");
    for (const type of ["match", "translate", "sentence", "stroke", "writer", "speed_match", "fill_blank"]) {
      db.prepare("INSERT INTO game_sessions (user_id,game_type) VALUES(?,?)").run(123, type);
    }
    assert.throws(() => db.prepare("INSERT INTO game_sessions (user_id,game_type) VALUES(?,?)").run(123,"unlisted"));
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name='unique_game_submission'").get());
    const later = db.prepare("INSERT INTO game_sessions (user_id,game_type) VALUES(?,?)").run(123,"match");
    assert.ok(Number(later.lastInsertRowid) > 321);
  } finally { db.close(); }
});

test("all five playable game types persist and award XP after fresh migration", async () => {
  const f = database();
  const token = await issueAccessToken({id:1,email:"learner@example.test",is_admin:false}, "game-schema-secret");
  const env = {DB:f.db,JWT_SECRET:"game-schema-secret",ENVIRONMENT:"development"} as any;
  try {
    for (const type of ["match", "translate", "sentence", "stroke", "writer"]) {
      const score = ["translate","sentence","stroke"].includes(type) ? 80 : 100;
      const response = await games.request("http://test/session", {
        method:"POST", headers:{Authorization:"Bearer "+token, "Content-Type":"application/json"},
        body:JSON.stringify({session_id:"test_schema_"+type,game_type:type,score,
          accuracy:0.8,duration_seconds:40,words_practiced:type==="writer"?1:5,
          xp_earned:type==="writer"?10:20}),
      },env);
      assert.equal(response.status,200,type+": "+await response.text());
    }
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM game_sessions WHERE user_id=1").get()?.n,5);
    assert.equal(f.sqlite.prepare("SELECT total_xp FROM user_stats WHERE user_id=1").get()?.total_xp,90);
  } finally { f.sqlite.close(); }
});

test("due words stored as ISO UTC timestamps are eligible on the same day", async () => {
  const f=database();
  const secret="due-date-test";
  const token=await issueAccessToken({id:1,email:"learner@example.test",is_admin:false},secret);
  const env={DB:f.db,JWT_SECRET:secret,ENVIRONMENT:"development"} as any;
  // An instant 5 minutes ago is <= datetime(now), but lexical ISO 'T' > SQLite space.
  const past=new Date(Date.now()-5*60000).toISOString();
  const future=new Date(Date.now()+2*3600000).toISOString();
  try {
    f.sqlite.prepare("INSERT INTO user_word_progress (user_id,word_id,next_review,flashcard_eligible_at) VALUES(1,1,?,?)").run(past,past);
    const due=await user.request("http://test/due-words",
      {headers:{Authorization:"Bearer "+token}},env);
    assert.equal(due.status,200);
    const result=await due.json() as any;
    assert.ok(result.data.some((w:any)=>w.id===1),"ISO timestamp was wrongly skipped");
    const mix=await words.request("http://test/due",{headers:{Authorization:"Bearer "+token}},env);
    assert.equal(mix.status,200);
    assert.ok((await mix.json() as any).data.some((w:any)=>w.id===1));
    f.sqlite.prepare("UPDATE user_word_progress SET flashcard_eligible_at=? WHERE user_id=1 AND word_id=1").run(future);
    const blocked=await user.request("http://test/due-words",
      {headers:{Authorization:"Bearer "+token}},env);
    assert.ok(!(await blocked.json() as any).data.some((w:any)=>w.id===1));
  } finally { f.sqlite.close(); }
});
