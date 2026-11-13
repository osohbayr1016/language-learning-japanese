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
  await page.screenshot({path:test.info().outputPath('daily-course-desktop.png'),fullPage:true});
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
  await page
    .locator('input[type=file]')
    .setInputFiles({
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
  await page.screenshot({path:test.info().outputPath('daily-course-mobile.png'),fullPage:true});
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
  await page.goto('/course');
  await page
    .getByRole('button', { name: 'Сонсгол эхлэх', exact: true })
    .click();
  await page
    .getByRole('button', { name: '▶ Сонсоод утгыг сонгох', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Япон дуу хоолой олдсонгүй',
  );
  await expect(
    page.getByRole('button', { name: 'Шалгах', exact: true }),
  ).toBeDisabled();
});
