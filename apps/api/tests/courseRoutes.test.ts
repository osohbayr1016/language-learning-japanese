import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import course from '../src/routes/course';
import { issueAccessToken } from '../src/lib/tokens';
import {
  DEFAULT_PREFERENCES,
  LESSONS,
  wordQuestions,
  lessonQuestions,
  writingCharacters,
} from '../../../packages/curriculum/src';
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  const directory = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(directory).sort())
    if (file.endsWith('.sql'))
      sqlite.exec(readFileSync(new URL(file, directory), 'utf8'));
  sqlite.exec(
    "INSERT INTO users(id,email,password_hash,display_name) VALUES(1,'learner@example.test','test','Learner'),(2,'other@example.test','test','Other')",
  );
  function prepare(sql: string, values: unknown[] = []): any {
    return {
      bind: (...args: unknown[]) => prepare(sql, args),
      first: async () => sqlite.prepare(sql).get(...(values as any[])) ?? null,
      all: async () => ({
        results: sqlite.prepare(sql).all(...(values as any[])),
      }),
      run: async () => {
        const info = sqlite.prepare(sql).run(...(values as any[]));
        return {
          meta: {
            last_row_id: Number(info.lastInsertRowid),
            changes: Number(info.changes),
          },
        };
      },
    };
  }
  return {
    sqlite,
    db: {
      prepare,
      batch: async (statements: any[]) => {
        sqlite.exec('BEGIN');
        try {
          const results = [];
          for (const s of statements) results.push(await s.run());
          sqlite.exec('COMMIT');
          return results;
        } catch (e) {
          sqlite.exec('ROLLBACK');
          throw e;
        }
      },
    },
  };
}
async function fixture() {
  const { sqlite, db } = database();
  const secret = 'local-test-secret-never-used-in-production';
  const token = await issueAccessToken(
    { id: 1, email: 'learner@example.test', is_admin: false },
    secret,
  );
  const token2 = await issueAccessToken(
    { id: 2, email: 'other@example.test', is_admin: false },
    secret,
  );
  const call = (
    path: string,
    body?: unknown,
    method = body ? 'POST' : 'GET',
    auth: string | null = token,
  ) =>
    course.request(
      'http://test' + path,
      {
        method,
        headers: {
          ...(auth ? { Authorization: 'Bearer ' + auth } : {}),
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      { DB: db, JWT_SECRET: secret } as any,
    );
  return { sqlite, call, token2 };
}
function evidence() {
  return {
    id: 'route_event_0001',
    at: new Date().toISOString(),
    day: '2026-11-13',
    kind: 'task',
    lessonId: LESSONS[0].id,
    task: 'words',
    answers: wordQuestions(LESSONS[0].words).map((q) => q.answer),
  };
}
test('fresh migrations and foreign keys are valid', () => {
  const { sqlite } = database();
  assert.equal(
    sqlite.prepare('PRAGMA integrity_check').get()?.integrity_check,
    'ok',
  );
  assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(), []);
  sqlite.close();
});
test('course requires authentication and isolates both learners', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.call('/', undefined, 'GET', null)).status, 401);
    assert.equal(
      (await f.call('/events', { events: [evidence()] })).status,
      200,
    );
    const one = (await (await f.call('/')).json()) as any;
    assert.equal(one.data.events.length, 1);
    const other = (await (
      await f.call('/', undefined, 'GET', f.token2)
    ).json()) as any;
    assert.deepEqual(other.data.events, []);
  } finally {
    f.sqlite.close();
  }
});
test('retries are idempotent and invalid evidence is atomic', async () => {
  const f = await fixture();
  try {
    for (let i = 0; i < 2; i++)
      assert.equal(
        (await f.call('/events', { events: [evidence()] })).status,
        200,
      );
    assert.equal(
      f.sqlite.prepare('SELECT count(*) n FROM course_events').get()?.n,
      1,
    );
    assert.equal(
      (
        await f.call('/events', {
          events: [
            {
              ...evidence(),
              id: 'new_event_0001',
              lessonId: 'n5-01',
              answers: wordQuestions(
                LESSONS.find((l) => l.id === 'n5-01')!.words,
              ).map((q) => q.answer),
            },
          ],
        })
      ).status,
      409,
    );
    assert.equal(
      (await f.call('/events', { events: [{ ...evidence(), answers: [999] }] }))
        .status,
      400,
    );
    assert.equal(
      f.sqlite.prepare('SELECT count(*) n FROM course_events').get()?.n,
      1,
    );
  } finally {
    f.sqlite.close();
  }
});
test('settings reject invalid schedules and survive a new request', async () => {
  const f = await fixture();
  try {
    assert.equal(
      (
        await f.call(
          '/preferences',
          { ...DEFAULT_PREFERENCES, minutes: 0 },
          'PUT',
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await f.call(
          '/preferences',
          { ...DEFAULT_PREFERENCES, minutes: 45 },
          'PUT',
        )
      ).status,
      200,
    );
    const state = (await (await f.call('/')).json()) as any;
    assert.equal(state.data.preferences.minutes, 45);
  } finally {
    f.sqlite.close();
  }
});

test('N4 evidence syncs only after the N5 extension and remains account-scoped', async () => {
  const f = await fixture();
  let serial = 0;
  const evidenceFor = (lessons: typeof LESSONS) => lessons.flatMap(l => [
    {kind:'task',lessonId:l.id,task:'words',answers:wordQuestions(l.words).map(q=>q.answer)},
    {kind:'task',lessonId:l.id,task:'reading',answers:[l.readingQuestion.answer]},
    {kind:'task',lessonId:l.id,task:'writing',characters:writingCharacters(l)},
    {kind:'task',lessonId:l.id,task:'quiz',answers:lessonQuestions(l).map(q=>q.answer)},
  ].map(e => {
    const i = ++serial;
    return {...e,id:'n4_sync_'+String(i).padStart(8,'0'),at:new Date(Date.UTC(2026,0,1,0,0,i)).toISOString(),day:'2026-01-01'};
  }));
  const upload = async (events: ReturnType<typeof evidenceFor>) => {
    for (let i=0; i<events.length; i+=100)
      assert.equal((await f.call('/events',{events:events.slice(i,i+100)})).status,200);
  };
  try {
    const old = evidenceFor(LESSONS.slice(0,50));
    await upload(old);
    const n4Index=LESSONS.findIndex(l=>l.id==='n4-01');
    // Build the missing prerequisites before the later N4 attempt so timestamps
    // preserve the actual learning order when a second device replays the log.
    const extension=evidenceFor(LESSONS.slice(50,n4Index));
    const n4=evidenceFor([LESSONS[n4Index]]);
    assert.equal((await f.call('/events',{events:n4})).status,409);
    assert.equal(f.sqlite.prepare('SELECT count(*) n FROM course_events').get()?.n,old.length);
    await upload(extension);
    await upload(n4);
    await upload(n4); // Retry from another device must not duplicate evidence.
    const state=(await (await f.call('/')).json()) as any;
    assert.equal(state.data.events.length,old.length+extension.length+n4.length);
    assert.equal(state.data.events.filter((e:any)=>e.lessonId==='n4-01').length,4);
    const other=(await (await f.call('/',undefined,'GET',f.token2)).json()) as any;
    assert.deepEqual(other.data.events,[]);
  } finally { f.sqlite.close(); }
});
