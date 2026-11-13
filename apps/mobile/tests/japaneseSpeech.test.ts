import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreJapaneseUtterance,
  scoreBestJapaneseUtterance,
} from '../src/lib/audio/speechScoring';
import {
  createJapaneseRecognitionSession,
  type RecCtor,
} from '../src/lib/audio/recognitionSession';
test('Japanese kana/kanji and half-width spellings are accepted', () => {
  const target = { jp: '食べる', kana: 'たべる', romaji: 'taberu' };
  for (const text of ['食べる', 'たべる', 'ﾀﾍﾞﾙ'])
    assert.equal(scoreJapaneseUtterance(text, target).pass, true);
});
test('short mora, long vowels and gemination cannot be loosely passed', () => {
  assert.equal(
    scoreJapaneseUtterance('きて', {
      jp: 'きって',
      kana: 'きって',
      romaji: 'kitte',
    }).pass,
    false,
  );
  assert.equal(
    scoreJapaneseUtterance('おばさん', {
      jp: 'おばあさん',
      kana: 'おばあさん',
      romaji: 'obaasan',
    }).pass,
    false,
  );
  assert.equal(
    scoreJapaneseUtterance('wǒ', {
      jp: 'わたし',
      kana: 'わたし',
      romaji: 'watashi',
    }).pass,
    false,
  );
});
test('Japanese recognition alternatives handle orthography without inventing phonetics', () => {
  const result = scoreBestJapaneseUtterance(['学制', 'がくせい'], {
    jp: '学生',
    kana: 'がくせい',
    romaji: 'gakusei',
  });
  assert.equal(result.pass, true);
  assert.equal(result.matchedTranscript, 'がくせい');
});
function fixture() {
  let rec: any;
  class Recognition {
    lang = '';
    continuous = false;
    interimResults = false;
    maxAlternatives = 0;
    onstart: any;
    onerror: any;
    onend: any;
    onresult: any;
    constructor() {
      rec = this;
    }
    start() {
      this.onstart?.();
    }
    stop() {
      this.onend?.();
    }
    abort() {
      this.onerror?.({ error: 'aborted' });
      this.onend?.();
    }
  }
  const finals: string[] = [],
    errors: string[] = [];
  const handle = createJapaneseRecognitionSession(
    Recognition as RecCtor,
    () => {},
    () => {},
    (t) => finals.push(t),
    (e) => errors.push(e),
    () => {},
  );
  return { rec, handle, finals, errors };
}
test('recognizer requests Japanese and does not grade interim guesses or denial', () => {
  const f = fixture();
  assert.equal(f.rec.lang, 'ja-JP');
  f.rec.onresult({
    resultIndex: 0,
    results: [
      Object.assign([{ transcript: 'わたし', confidence: 0.8 }], {
        isFinal: false,
      }),
    ],
  });
  f.rec.onerror({ error: 'not-allowed' });
  f.rec.onend();
  assert.deepEqual(f.finals, []);
  assert.match(f.errors[0], /зөвшөөрөл/);
});
test('repeated final callbacks do not double the transcript; abort is silent', () => {
  const f = fixture();
  const event = {
    resultIndex: 0,
    results: [
      Object.assign([{ transcript: 'わたし', confidence: 0.8 }], {
        isFinal: true,
      }),
    ],
  };
  f.rec.onresult(event);
  f.rec.onresult(event);
  f.rec.onend();
  assert.deepEqual(f.finals, ['わたし']);
  const g = fixture();
  g.handle?.abort();
  assert.deepEqual(g.errors, []);
  assert.deepEqual(g.finals, []);
});
