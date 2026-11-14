import test from "node:test";
import assert from "node:assert/strict";
import { maxPossibleGameScore, plausibleGameScore, type GameType } from "../src/lib/gameScoreCeilings";
import { database } from "./helpers/database";
import games from "../src/routes/games";
import { issueAccessToken } from "../src/lib/tokens";

test("game scoring ceilings match shipped mechanics and reject inflated totals",()=>{
  const cases: [GameType,number,number][] = [
    ["match",6,300],["translate",8,128],["sentence",6,96],
    ["stroke",10,160],["writer",1,100],
  ];
  for (const [kind,count,maximum] of cases) {
    assert.equal(maxPossibleGameScore(kind,count),maximum);
    assert.equal(plausibleGameScore(kind,maximum,count),true);
    assert.equal(plausibleGameScore(kind,maximum+1,count),false);
  }
  assert.equal(plausibleGameScore("writer",100,2),false);
  assert.equal(plausibleGameScore("match",100,0),false);
  assert.equal(plausibleGameScore("match",1.5,1),false);
});

test("impossible scoring submissions cannot create reward receipts or XP",async()=>{
  const f=database(),secret="game-ceiling-secret";
  const token=await issueAccessToken({id:1,email:"learner@example.test",is_admin:false},secret);
  try{
    for(const kind of ["match","translate","sentence","stroke","writer"] as GameType[]){
      const maximum=maxPossibleGameScore(kind,kind==="writer"?1:5);
      const response=await games.request("http://test/session",{
        method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
        body:JSON.stringify({session_id:"score_limit_"+kind,game_type:kind,
          score:maximum+1,accuracy:1,duration_seconds:10,
          words_practiced:kind==="writer"?1:5,xp_earned:0}),
      },{DB:f.db,JWT_SECRET:secret,ENVIRONMENT:"development"} as any);
      assert.equal(response.status,400,kind);
    }
    assert.equal(f.sqlite.prepare("SELECT count(*) n FROM reward_receipts").get()?.n,0);
    assert.equal(f.sqlite.prepare("SELECT count(*) n FROM game_sessions").get()?.n,0);
  } finally {f.sqlite.close();}
});
