import test from "node:test";
import assert from "node:assert/strict";
import { mergeLearnedWords, genuinelyNewWords, type LearnedWord } from "../src/lib/learnedWordsMerge";

const word=(id:string|number,kana:string,meaning_mn="муур"):LearnedWord=>({
  id,kana,kanji:kana,meaning_mn,romaji:"neko",learnedAt:100,
});

test("legacy random IDs for identical vocabulary are merged without losing the original",()=>{
  const older=[word(42,"ねこ"),word(777,"ねこ"),word(12,"いぬ","нохой")];
  const fresh=[word("reading:ねこ:муур","ねこ"),word("reading:いぬ:нохой","いぬ","нохой")];
  const combined=mergeLearnedWords(older,fresh);
  assert.equal(combined.length,2);
  assert.equal(combined[0].id,42);
  assert.equal(genuinelyNewWords(older,fresh),0);
  assert.deepEqual(older.map(w=>w.id),[42,777,12]);
});

test("new vocabulary remains distinct and Japanese homographs can have separate meanings",()=>{
  const current=[word("first","はし","гүүр")];
  const next=[word("second","はし","савх"),word("third","ねこ")];
  assert.equal(genuinelyNewWords(current,next),2);
  assert.equal(mergeLearnedWords(current,next).length,3);
  assert.equal(mergeLearnedWords(current,[word("duplicate","はし","гүүр")]).length,1);
});
