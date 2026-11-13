import { test, expect, type Page } from "@playwright/test";
import { DEFAULT_PREFERENCES } from "../packages/curriculum/src";
async function durable(page: Page) {
  await expect(page.locator(".course-save-state")).toContainText(
    "Төхөөрөмжид хадгалагдсан",
  );
}
async function traceFirstStroke(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".course-tutor iframe").scrollIntoViewIfNeeded();
  const frame = page.frameLocator(".course-tutor iframe");
  await expect(frame.locator("#paths path").first()).toBeVisible();
  const points = await frame
    .locator("#paths path")
    .first()
    .evaluate((el) => {
      const path = el as SVGPathElement,
        len = path.getTotalLength(),
        matrix = path.getScreenCTM()!;
      return Array.from({ length: 40 }, (_, i) => {
        const p = path.getPointAtLength((len * i) / 39);
        const point = new DOMPoint(p.x, p.y).matrixTransform(matrix);
        return { x: point.x, y: point.y };
      });
    });
  const box = (await page.locator(".course-tutor iframe").boundingBox())!;
  await page.mouse.move(box.x + points[0].x, box.y + points[0].y);
  await page.mouse.down();
  for (const p of points.slice(1))
    await page.mouse.move(box.x + p.x, box.y + p.y);
  await page.mouse.up();
}
test("more than twenty thousand legacy events migrate without resetting and survive a new visit", async ({
  page,
}) => {
  test.setTimeout(90000);
  const events = Array.from({ length: 20001 }, (_, i) => ({
    id: "large_history_" + String(i).padStart(8, "0"),
    at: "2026-01-01T01:00:00.000Z",
    day: "2026-01-01",
    kind: "study",
    seconds: 60,
  }));
  await page.addInitScript(
    (data) => {
      if (!localStorage.getItem("seeded-history")) {
        localStorage.setItem("nihongo.course.v1.guest", JSON.stringify(data));
        localStorage.setItem("seeded-history", "yes");
      }
    },
    { version: 1, events, preferences: DEFAULT_PREFERENCES },
  );
  await page.goto("/course");
  await expect(page.locator(".course-page")).toBeVisible({ timeout: 45000 });
  await durable(page);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve, reject) => {
            const r = indexedDB.open("nihongo-progress-v2");
            r.onsuccess = () => {
              const db = r.result;
              const tx = db.transaction("events");
              const q = tx
                .objectStore("events")
                .index("account")
                .count("guest");
              q.onsuccess = () => {
                resolve(q.result);
                db.close();
              };
              q.onerror = () => reject(q.error);
            };
          }),
      ),
    )
    .toBeGreaterThanOrEqual(20001);
  await page.reload();
  await page.getByRole("button", { name: "JLPT зам", exact: true }).click();
  await expect(page.locator(".course-stat-grid").first()).toContainText(
    "20001",
  );
});
test("a quiz resumes its checked answer and next question after refresh", async ({
  page,
}) => {
  await page.goto("/course");
  await page
    .getByRole("button", { name: "Шинэ үг эхлэх", exact: true })
    .click();
  await page.locator(".course-quiz input").first().check();
  await page.getByRole("button", { name: "Шалгах", exact: true }).click();
  await durable(page);
  await page.reload();
  await expect(page.locator(".course-quiz input").first()).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Дараагийн асуулт", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Дараагийн асуулт", exact: true })
    .click();
  await durable(page);
  await page.reload();
  await expect(page.locator(".course-quiz .course-kicker")).toContainText(
    "2 / 3",
  );
});
test("a correctly traced partial character resumes at its next stroke", async ({
  page,
}) => {
  await page.goto("/course");
  await page.getByRole("button", { name: "Бичлэг эхлэх", exact: true }).click();
  await page.getByRole("button", { name: "Өөрөө бичих", exact: true }).click();
  await traceFirstStroke(page);
  await expect(
    page.frameLocator(".course-tutor iframe").locator("#status"),
  ).toContainText("Зурлага 2");
  await durable(page);
  await page.reload();
  await expect(
    page.frameLocator(".course-tutor iframe").locator("#status"),
  ).toContainText("Зурлага 2");
});
test("fresh visitors reach register and password recovery without mandatory onboarding or fake Google controls", async ({
  page,
}) => {
  await page.goto("/course");
  await page.getByRole("link", { name: "Бүртгэл үүсгэх", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByRole("button", { name: "Google-ээр нэвтрэх", exact: true }),
  ).toHaveCount(0);
  await page.route("**/api/auth/capabilities", (route) =>
    route.fulfill({
      json: { data: { passwordReset: true, acousticAssessment: false } },
    }),
  );
  await page.goto("/forgot-password");
  await expect(page.getByLabel("Бүртгэлтэй имэйл")).toBeVisible();
  await page.route("**/api/auth/password-reset/request", (route) =>
    route.fulfill({ json: { message: "Сэргээх холбоос илгээгдэнэ." } }),
  );
  await page.getByLabel("Бүртгэлтэй имэйл").fill("learner@example.test");
  await page.getByRole("button", { name: "Холбоос авах", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Сэргээх холбоос илгээгдэнэ." }),
  ).toBeVisible();
});
test("course navigation uses the same local evidence for progress and profile", async ({
  page,
}) => {
  await page.goto("/course");
  const nav = page.getByRole("navigation", { name: "Үндсэн цэс", exact: true });
  await nav.getByRole("link", { name: /Явц\./ }).click();
  await expect(page).toHaveURL(/tab=milestones/);
  await expect(
    page.getByRole("heading", { name: "Ахиц ба JLPT зорилго", exact: true }),
  ).toBeVisible();
  await nav.getByRole("link", { name: /Профайл\./ }).click();
  await expect(page).toHaveURL(/tab=settings/);
  await expect(
    page.getByRole("heading", { name: "Өөрийн хэмнэлээр сурах", exact: true }),
  ).toBeVisible();
});

test("the prepared course and stroke tutor reopen without a network connection", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await page.goto("/course?tab=settings");
  await page.getByText("Интернэтгүй суралцах багц", { exact: true }).click();
  await page.getByRole("button", { name: "Багцыг татах", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Багц бэлэн." }),
  ).toBeVisible({ timeout: 90000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBeTruthy();
  const privateCached = await page.evaluate(async () => {
    const cache = await caches.open("nihongo-static-v1");
    return (await cache.keys()).some((key) =>
      new URL(key.url).pathname.startsWith("/api/"),
    );
  });
  expect(privateCached).toBe(false);
  await context.setOffline(true);
  try {
    await page.goto("/course");
    await expect(
      page.getByRole("heading", { name: /Япон хэлний дэвтэр/ }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Бичлэг эхлэх", exact: true })
      .click();
    await expect(
      page.frameLocator(".course-tutor iframe").locator("#paths path").first(),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

test("short listening conversations require playable Japanese audio and retain the answer", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class {
        text: string;
        lang = "";
        voice: unknown;
        rate = 1;
        onstart: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [{ lang: "ja-JP", name: "Test Japanese" }],
        cancel() {},
        speak(u: SpeechSynthesisUtterance) {
          setTimeout(
            () => u.onstart?.(new Event("start") as SpeechSynthesisEvent),
            0,
          );
        },
      },
    });
  });
  await page.goto("/course?tab=practice");
  const section = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Богино яриаг ойлгох",
      exact: true,
    }),
  });
  await expect(section.getByRole("radio").first()).toBeDisabled();
  await section
    .getByRole("button", { name: "▶ Сонсоод утгыг сонгох", exact: true })
    .click();
  await section.getByRole("radio").nth(1).check();
  await section.getByRole("button", { name: "Шалгах", exact: true }).click();
  await section.getByRole("button", { name: "Дүн харах", exact: true }).click();
  await expect(section).toContainText("Сүүлийн оролдлого: зөв");
  await durable(page);
  await page.reload();
  await expect(section).toContainText("Сүүлийн оролдлого: зөв");
});

test("separate open tabs keep both task drafts when settings and events are saved", async ({
  page,
  context,
}) => {
  await page.goto("/course?tab=today&lesson=hiragana-01&task=words");
  await page.locator(".course-quiz input").first().check();
  await page.getByRole("button", { name: "Шалгах", exact: true }).click();
  await durable(page);
  const second = await context.newPage();
  await second.goto("/course?tab=today&lesson=hiragana-01&task=reading");
  await second.locator(".course-quiz input").nth(1).check();
  await second.getByRole("button", { name: "Шалгах", exact: true }).click();
  await durable(second);
  await page.reload();
  await expect(page.locator(".course-quiz input").first()).toBeChecked();
  await page
    .getByRole("button", { name: "Дараагийн асуулт", exact: true })
    .click();
  await durable(page);
  await second.reload();
  await expect(second.locator(".course-quiz input").nth(1)).toBeChecked();
  await second.close();
});

test('installable app uses the guided course and browser-decodable icons',async({page})=>{
 await page.goto('/course');
 await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href','/manifest.webmanifest');
 const manifest=await(await page.request.get('/manifest.webmanifest')).json();
 expect(manifest.start_url).toBe('/course');
 expect(manifest.shortcuts.every((item:{url:string})=>item.url.startsWith('/course'))).toBe(true);
 const dimensions=await page.evaluate(async()=>{const response=await fetch('/icons/app-512.png');const bitmap=await createImageBitmap(await response.blob());return{width:bitmap.width,height:bitmap.height};});
 expect(dimensions).toEqual({width:512,height:512});
 const registrations=await page.evaluate(async()=>{await navigator.serviceWorker.ready;return(await navigator.serviceWorker.getRegistrations()).length;});
 expect(registrations).toBe(1);
});
