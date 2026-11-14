import test from "node:test";
import assert from "node:assert/strict";
import { database } from "./helpers/database";
import { issueAccessToken } from "../src/lib/tokens";
import { receiptStatement } from "../src/lib/rewardReceipts";
import {
  DEFAULT_STUDY_TIMEZONE, studyLocalDay, validStudyTimeZone,
  previousStudyDay, visibleCurrentStreak,
} from "../src/lib/studyDay";
import { getLearningPreferences, updateLearningPreferences, validateLearningPreferencesPatch } from "../src/lib/learningPreferences";
import user from "../src/routes/user";
import games from "../src/routes/games";
import insights from "../src/routes/insights";

test("midnight follows Mongolia and the learner's configured IANA timezone", () => {
  const crossing=new Date("2026-11-14T17:00:00.000Z");
  assert.equal(DEFAULT_STUDY_TIMEZONE,"Asia/Ulaanbaatar");
  assert.equal(studyLocalDay("Asia/Ulaanbaatar",crossing),"2026-11-15");
  assert.equal(studyLocalDay("UTC",crossing),"2026-11-14");
  assert.equal(studyLocalDay("America/Los_Angeles",crossing),"2026-11-14");
  assert.equal(previousStudyDay("2026-03-01"),"2026-02-28");
  assert.equal(visibleCurrentStreak(12,"2026-11-12","2026-11-15"),0);
  assert.equal(visibleCurrentStreak(12,"2026-11-14","2026-11-15"),12);
  assert.equal(visibleCurrentStreak(12,"2026-11-15","2026-11-15"),12);
  assert.equal(validStudyTimeZone("Asia/Ulaanbaatar"),true);
  assert.equal(validStudyTimeZone("Invalid/City"),false);
  assert.ok(validateLearningPreferencesPatch({timezone:"Invalid/City"}));
});

test("reward receipts atomically credit a local-day streak and are retry safe", async () => {
  const f=database();
  try {
    const dayA="2026-11-13",dayB="2026-11-14";
    const a=receiptStatement(f.db as any,1,"game","day_session_A_001","digest-a",10,0,60,dayA);
    const b=receiptStatement(f.db as any,1,"study","day_session_B_001","digest-b",15,3,0,dayB);
    await f.db.batch([a]);
    await f.db.batch([b]);
    await f.db.batch([b]); // duplicate ID does not award points or streak days twice
    const streak=f.sqlite.prepare("SELECT current_streak,longest_streak,last_activity_date,total_days_studied FROM user_streaks WHERE user_id=1").get();
    assert.deepEqual({...streak},{current_streak:2,longest_streak:2,last_activity_date:dayB,total_days_studied:2});
    const total=f.sqlite.prepare("SELECT total_xp,total_reviews,games_played FROM user_stats WHERE user_id=1").get();
    assert.deepEqual({...total},{total_xp:25,total_reviews:3,games_played:1});
    assert.equal(f.sqlite.prepare("SELECT xp_earned FROM user_daily_activity WHERE user_id=1 AND activity_date=?").get(dayB)?.xp_earned,15);
    const next=receiptStatement(f.db as any,1,"game","day_session_C_001","digest-c",5,0,30,"2026-11-16");
    await f.db.batch([next]);
    assert.equal(f.sqlite.prepare("SELECT current_streak FROM user_streaks WHERE user_id=1").get()?.current_streak,1);
  } finally { f.sqlite.close(); }
});

test("stored learner timezone drives game award date, dashboard XP and current streak", async () => {
  const f=database(),secret="local-day-test-secret";
  const token=await issueAccessToken({id:1,email:"learner@example.test",is_admin:false},secret);
  const env={DB:f.db,JWT_SECRET:secret,ENVIRONMENT:"development"} as any;
  try {
    const defaultPrefs=await getLearningPreferences(f.db as any,1);
    assert.equal(defaultPrefs.timezone,"Asia/Ulaanbaatar");
    assert.equal((await updateLearningPreferences(f.db as any,1,{timezone:"Pacific/Honolulu"})).timezone,"Pacific/Honolulu");
    const response=await games.request("http://test/session",{method:"POST",
      headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
      body:JSON.stringify({session_id:"local_day_game_001",game_type:"match",score:50,
        accuracy:0.8,duration_seconds:60,words_practiced:5,xp_earned:10})},env);
    assert.equal(response.status,200,await response.text());
    const day=studyLocalDay("Pacific/Honolulu");
    assert.equal(f.sqlite.prepare("SELECT activity_day FROM reward_receipts").get()?.activity_day,day);
    assert.equal(f.sqlite.prepare("SELECT xp_earned FROM user_daily_activity WHERE activity_date=?").get(day)?.xp_earned,10);
    assert.equal(f.sqlite.prepare("SELECT last_activity_date FROM user_streaks").get()?.last_activity_date,day);
    const dashboard=await user.request("http://test/dashboard",{headers:{Authorization:"Bearer "+token}},env);
    const json=await dashboard.json() as any;
    assert.equal(json.data.today_xp,10);
    assert.equal(json.data.streak.current_streak,1);
    const insight=await insights.request("http://test/summary",{headers:{Authorization:"Bearer "+token}},env);
    assert.equal((await insight.json() as any).data.current_streak,1);
  } finally { f.sqlite.close(); }
});

test("empty zero-XP study receipts cannot manufacture streak days", async () => {
  const f=database(),secret="empty-srs-secret";
  const token=await issueAccessToken({id:1,email:"learner@example.test",is_admin:false},secret);
  try {
    const res=await user.request("http://test/progress",{
      method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
      body:JSON.stringify({session_id:"empty_study_session",results:[],xp_earned:0,session_type:"flashcard"}),
    },{DB:f.db,JWT_SECRET:secret,ENVIRONMENT:"development"} as any);
    assert.equal(res.status,400);
    assert.equal(f.sqlite.prepare("SELECT count(*) n FROM reward_receipts").get()?.n,0);
    assert.equal(f.sqlite.prepare("SELECT count(*) n FROM user_streaks").get()?.n,0);
  } finally { f.sqlite.close(); }
});
