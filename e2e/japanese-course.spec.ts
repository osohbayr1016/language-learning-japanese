import { test, expect, type Page } from '@playwright/test';
import {
  LESSONS,
  wordQuestions,
  lessonQuestions,
  writingCharacters,
  HIRAGANA_PLACEMENT,
} from '../packages/curriculum/src';
const first = LESSONS[0];
async function answerQuiz(page: Page, questions: { answer: number }[]) {
  for (let i = 0; i < questions.length; i++) {
    await page
      .locator('.course-quiz input[type=radio]')
      .nth(questions[i].answer)
      .check();
    await page.getByRole('button', { name: 'Шалгах', exact: true }).click();
    await page
      .getByRole('button', {
        name: i === questions.length - 1 ? 'Дүн харах' : 'Дараагийн асуулт',
        exact: true,
      })
      .click();
  }
}
async function traceGlyph(page: Page, reverse = false) {
  const frame = page.frameLocator('.course-tutor iframe');
  await expect(frame.locator('#paths path').first()).toBeVisible();
  const paths = await frame.locator('#paths path').evaluateAll((elements) =>
    elements.map((el) => {
      const p = el as SVGPathElement;
      const len = p.getTotalLength();
      const matrix = p.getScreenCTM()!;
      return Array.from({ length: 40 }, (_, j) => {
        const pt = p.getPointAtLength((len * j) / 39);
        const world = new DOMPoint(pt.x, pt.y).matrixTransform(matrix);
        return { x: world.x, y: world.y };
      });
    }),
  );
  const box = await page.locator('.course-tutor iframe').boundingBox();
  if (!box) throw Error('Missing writing frame');
  for (const path of paths) {
    const pts = reverse ? [...path].reverse() : path;
    await page.mouse.move(box.x + pts[0].x, box.y + pts[0].y);
    await page.mouse.down();
    for (const p of pts.slice(1))
      await page.mouse.move(box.x + p.x, box.y + p.y);
    await page.mouse.up();
    if (reverse) break;
  }
}
test('guest course works without account or API, with locked future lessons', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/**', (r) => r.abort());
  await page.goto('/course');
  await expect(
    page.getByRole('heading', { name: /Япон хэлний дэвтэр/ }),
  ).toBeVisible();
  await expect(page.locator('.course-ring')).toContainText('0/4');
  await page.screenshot({
    path: test.info().outputPath('daily-course-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Хөтөлбөр', exact: true }).click();
  await expect(
    page.getByRole('button').filter({ hasText: 'Хирагана · か き く け こ' }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test('whole first day: words, reading, real tracing, checkpoint and reload', async ({
  page,
}) => {
  await page.goto('/course');
  await page
    .getByRole('button', { name: 'Шинэ үг эхлэх', exact: true })
    .click();
  await answerQuiz(page, wordQuestions(first.words));
  await page.getByRole('button', { name: '← Өдрийн төлөвлөгөө' }).click();
  await expect(page.locator('.course-ring')).toContainText('1/4');
  await page
    .getByRole('button', { name: 'Уншлага эхлэх', exact: true })
    .click();
  await answerQuiz(page, [first.readingQuestion]);
  await page.getByRole('button', { name: '← Өдрийн төлөвлөгөө' }).click();
  await page.getByRole('button', { name: 'Бичлэг эхлэх', exact: true }).click();
  await page.getByRole('button', { name: 'Өөрөө бичих', exact: true }).click();
  for (const char of writingCharacters(first)) {
    await page
      .locator('.course-glyph-row')
      .getByRole('button', { name: char, exact: true })
      .click();
    await traceGlyph(page);
    await expect(page.locator('.course-tutor')).toContainText(
      'Зөв дарааллаар бичлээ',
    );
  }
  await page.getByRole('button', { name: '← Өдрийн төлөвлөгөө' }).click();
  await page
    .getByRole('button', { name: 'Бататгах эхлэх', exact: true })
    .click();
  await answerQuiz(page, lessonQuestions(first));
  await page.getByRole('button', { name: '← Өдрийн төлөвлөгөө' }).click();
  await expect(page.locator('.course-ring')).toContainText('4/4');
  await page.reload();
  await expect(page.locator('.course-ring')).toContainText('4/4');
  await expect(page.locator('.course-hero')).toContainText(first.title);
  await page.getByRole('button', { name: 'Хөтөлбөр', exact: true }).click();
  await expect(
    page.getByRole('button').filter({ hasText: 'Хирагана · か き く け こ' }),
  ).toBeEnabled();
});
test('reversed stroke direction does not award a writing completion', async ({
  page,
}) => {
  await page.goto('/course');
  await page.getByRole('button', { name: 'Бичлэг эхлэх', exact: true }).click();
  await page.getByRole('button', { name: 'Өөрөө бичих', exact: true }).click();
  await traceGlyph(page, true);
  await expect(page.locator('.course-tutor')).toContainText(
    'Дараалал, чиглэлээ шалгаарай',
  );
  await page.getByRole('button', { name: '← Өдрийн төлөвлөгөө' }).click();
  await expect(page.locator('.course-ring')).toContainText('0/4');
});
test('recognition placement continues at katakana, never at kanji or N4', async ({
  page,
}) => {
  await page.goto('/course');
  await page
    .getByRole('button', { name: 'Мэдлэгээ шалгах', exact: true })
    .click();
  await answerQuiz(page, HIRAGANA_PLACEMENT);
  await expect(page.locator('.course-hero')).toContainText('Катакана');
  await page.reload();
  await expect(page.locator('.course-hero')).toContainText('Катакана');
});
test('dictionary is searchable and loads Japanese stroke data without a CDN', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (/jsdelivr|hanzi-writer-data/.test(r.url())) external.push(r.url());
  });
  await page.goto('/course?tab=library');
  await page
    .getByRole('button', { name: 'Бүх ханзны толь', exact: true })
    .click();
  await page.getByPlaceholder('漢, かん, water, ус…').fill('water');
  await expect(page.locator('.course-glyph-grid button').first()).toBeVisible();
  await page.locator('.course-glyph-grid button').first().click();
  await expect(
    page.frameLocator('.course-tutor iframe').locator('#paths path').first(),
  ).toBeVisible();
  expect(external).toEqual([]);
});
test('invalid progress imports cannot overwrite an existing plan', async ({
  page,
}) => {
  await page.goto('/course?tab=settings');
  await page.locator('input[type=file]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"events":[{"kind":"task"}]}'),
  });
  await expect(
    page.getByText('Япон сургалтын экспортын файл биш байна.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Өнөөдөр', exact: true }).click();
  await expect(page.locator('.course-ring')).toContainText('0/4');
});
test('export contains course evidence but no account credentials', async ({
  page,
}) => {
  await page.goto('/course?tab=settings');
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Явцаа экспортлох', exact: true })
    .click();
  const item = await download;
  const stream = await item.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const value = Buffer.concat(chunks).toString();
  expect(JSON.parse(value).version).toBe(1);
  expect(value).not.toMatch(/auth_token|access_token|refresh_token/);
});
test('360 px layout remains inside viewport across all course sections', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/course');
  await expect(page.locator('.course-page')).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('daily-course-mobile.png'),
    fullPage: true,
  });
  for (const name of [
    'Өнөөдөр',
    'Хөтөлбөр',
    'Үг ба ханз',
    'JLPT зам',
    'Төлөвлөгөө',
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.course-page')).toBeVisible();
    const width = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.viewport + 1);
  }
});
test('unavailable Japanese voice leaves listening practice ungraded', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { getVoices: () => [], cancel: () => {}, speak: () => {} },
    });
  });
  await page.route('**/api/audio/tts?**', r => r.abort());
  await page.goto('/course');
  await page
    .getByRole('button', { name: 'Сонсгол эхлэх', exact: true })
    .click();
  await page
    .getByRole('button', { name: '▶ Сонсоод утгыг сонгох', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Япон дууг тоглуулж чадсангүй',
  );
  await expect(
    page.getByRole('button', { name: 'Шалгах', exact: true }),
  ).toBeDisabled();
});

test('first visit opens the guided course directly with no login wall', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/course$/);
  await expect(
    page.getByRole('heading', { name: /Япон хэлний дэвтэр/ }),
  ).toBeVisible();
});

test('Japanese server audio is used when the device has no Japanese voice', async ({page}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', {configurable:true,value:{getVoices:()=>[],cancel:()=>{}}});
    class AudioStub {
      src:string; preload='';
      constructor(src:string){this.src=src;(window as unknown as {playedJapanese:string}).playedJapanese=src}
      play(){return Promise.resolve()}
      pause(){} removeAttribute(){} load(){}
    }
    Object.defineProperty(window, 'Audio', {configurable:true,value:AudioStub});
  });
  await page.goto('/course');
  await page.getByRole('button', {name:'Сонсгол эхлэх',exact:true}).click();
  await expect(page.locator('.course-quiz input').first()).toBeDisabled();
  await page.getByRole('button', {name:'▶ Сонсоод утгыг сонгох',exact:true}).click();
  await expect(page.locator('.course-quiz input').first()).toBeEnabled();
  const url=await page.evaluate(()=>(window as unknown as {playedJapanese:string}).playedJapanese);
  expect(url).toContain('/api/audio/tts?');
  expect(new URL(url).searchParams.get('text')).toBe(first.words[0].kana);
});

function completionEvidence(lessons: typeof LESSONS) {
  let id = 0;
  return lessons.flatMap(l => [
    {kind:'task', lessonId:l.id, task:'words', answers:wordQuestions(l.words).map(q=>q.answer)},
    {kind:'task', lessonId:l.id, task:'reading', answers:[l.readingQuestion.answer]},
    {kind:'task', lessonId:l.id, task:'writing', characters:writingCharacters(l)},
    {kind:'task', lessonId:l.id, task:'quiz', answers:lessonQuestions(l).map(q=>q.answer)},
  ].map(e=>({...e,id:'seed_evidence_'+String(++id).padStart(8,'0'),at:'2026-01-01T01:00:00.000Z',day:'2026-01-01'})));
}
async function seedCourse(page: Page, evidence: ReturnType<typeof completionEvidence>) {
  await page.addInitScript(events => {
    const key = 'nihongo.course.v1.guest';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({version:1,events,preferences:{minutes:20,daysPerWeek:7,timezone:'Asia/Ulaanbaatar',target:'N2'}}));
  }, evidence);
}
test('the previous 50-unit export continues at N5 extension without granting N4', async ({page}) => {
  await seedCourse(page, completionEvidence(LESSONS.slice(0,50)));
  await page.goto('/course');
  await expect(page.locator('.course-hero')).toContainText('Үйл үгийн бүлгийг ялгах');
  await page.getByRole('button',{name:'Хөтөлбөр',exact:true}).click();
  const n4 = page.locator('.course-stage').filter({has:page.getByRole('heading',{name:'04 · N4 суурь',exact:true})});
  await n4.locator('summary').click();
  await expect(n4.getByRole('button').filter({hasText:'Нөхцөлөө тайлбарлах'})).toBeDisabled();
  await page.getByRole('button',{name:'JLPT зам',exact:true}).click();
  const n5 = page.locator('.course-evidence').filter({has:page.getByRole('heading',{name:'N5 суурь',exact:true})});
  await expect(n5).toContainText('24 / 40 хичээл');
  const n4Progress = page.locator('.course-evidence').filter({has:page.getByRole('heading',{name:'N4 суурь',exact:true})});
  await expect(n4Progress).toContainText('0 / 32 хичээл');
});
test('N4 reading offers optional kana support and records real comprehension', async ({page}) => {
  const index=LESSONS.findIndex(l=>l.id==='n4-01');
  const lesson=LESSONS[index];
  await seedCourse(page,completionEvidence(LESSONS.slice(0,index)));
  await page.goto('/course');
  await expect(page.locator('.course-hero')).toContainText(lesson.title);
  await page.getByRole('button',{name:'Уншлага эхлэх',exact:true}).click();
  await expect(page.locator('.course-reading-support')).toHaveCount(0);
  await page.getByRole('button',{name:'Кана уншлага харах',exact:true}).click();
  await expect(page.locator('.course-reading-support')).toHaveText(lesson.passageKana!);
  await answerQuiz(page,[lesson.readingQuestion]);
  await page.getByRole('button',{name:'← Өдрийн төлөвлөгөө'}).click();
  await expect(page.locator('.course-ring')).toContainText('1/4');
  await page.reload();
  await expect(page.locator('.course-ring')).toContainText('1/4');
  await page.getByRole('button',{name:'Бичлэг эхлэх',exact:true}).click();
  await expect(page.locator('.course-kanji-hint')).toContainText('толгой');
  await expect(page.frameLocator('.course-tutor iframe').locator('#paths path').first()).toBeVisible();
  await page.screenshot({path:test.info().outputPath('n4-writing-desktop.png'),fullPage:true});
});
test('daily kanji opens the selected character in the dictionary', async ({page}) => {
  const index=LESSONS.findIndex(l=>l.id==='n4-01');
  await seedCourse(page,completionEvidence(LESSONS.slice(0,index)));
  await page.goto('/course');
  await page.locator('.course-glyph-row').getByRole('button',{name:'頭',exact:true}).click();
  await expect(page).toHaveURL(/tab=library/);
  await expect(page.locator('.course-library-detail h3')).toContainText('頭');
  await expect(page.locator('.course-library-detail h3')).toContainText('толгой');
  await expect(page.frameLocator('.course-tutor iframe').locator('#paths path').first()).toBeVisible();
});
test('N4 words keep kanji separate from the kana sound grid and expose all new vocabulary', async ({page}) => {
  const index=LESSONS.findIndex(l=>l.id==='n4-01');
  await seedCourse(page,completionEvidence(LESSONS.slice(0,index)));
  await page.goto('/course');
  await page.getByRole('button',{name:'Шинэ үг эхлэх',exact:true}).click();
  await expect(page.locator('.course-glyph-grid')).toHaveCount(0);
  await expect(page.locator('.course-vocab-grid article')).toHaveCount(6);
  await answerQuiz(page,wordQuestions(LESSONS[index].words));
  await page.getByRole('button',{name:'← Өдрийн төлөвлөгөө'}).click();
  await page.getByRole('button',{name:'JLPT зам',exact:true}).click();
  const p=page.locator('.course-evidence').filter({has:page.getByRole('heading',{name:'N4 суурь',exact:true})});
  await expect(p).toContainText('0 / 32 хичээл');
  await expect(p.locator('dd').first()).toContainText('6 /');
});

test('large word library is paginated, level-filtered and searchable', async ({page}) => {
  await page.setViewportSize({width:360,height:800});
  await page.goto('/course?tab=library');
  await page.getByRole('button',{name:'Үгс',exact:true}).click();
  await expect(page.locator('.course-vocab-grid article')).toHaveCount(24);
  await page.getByLabel('Үгийн түвшин',{exact:true}).selectOption('n4');
  await expect(page.getByRole('status')).toContainText('192 хичээлийн карт');
  await expect(page.locator('.course-vocab-grid article h3').first()).toHaveText('頭');
  await page.getByRole('button',{name:'Дараагийн үгс',exact:true}).click();
  await expect(page.locator('.course-vocab-grid article h3').first()).toHaveText('漢字');
  await page.getByPlaceholder('Үг, уншлага, утга…').fill('申し込む');
  await expect(page.locator('.course-vocab-grid article')).toHaveCount(1);
  await expect(page.locator('.course-vocab-grid article')).toContainText('бүртгүүлэх');
  await expect(page.getByRole('button',{name:'Дараагийн үгс',exact:true})).toBeDisabled();
  await page.getByPlaceholder('Үг, уншлага, утга…').fill('not-a-japanese-word');
  await expect(page.getByText('Үг олдсонгүй. Хайлт эсвэл түвшнээ өөрчлөөрэй.',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.screenshot({path:test.info().outputPath('word-library-mobile.png'),fullPage:true});
});
