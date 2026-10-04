import { expect, test, type Page } from '@playwright/test';

type Action = {
  kind: 'review' | 'foundation' | 'checkpoint' | 'lesson' | 'weak_skill' | 'explore';
  title: string;
  subtitle: string;
  href: string;
  reason: string;
  lesson_id?: number;
  due_count?: number;
};

const word = {
  id: 1,
  kanji: '私',
  romaji: 'watashi',
  romaji_numbered: null,
  kana: 'わたし',
  meaning_mn: 'би',
  meaning_en: 'I',
  jlpt_level: 1,
  part_of_speech: 'pronoun',
  example_jp: '私は学生です。',
  example_romaji: 'watashi wa gakusei desu',
  example_mn: 'Би оюутан.',
  audio_url: null,
  stroke_count: 7,
  ease_factor: 2.5,
  interval: 1,
  repetitions: 1,
  next_review: null,
  last_reviewed: null,
};

const lesson1 = {
  id: 1,
  chapter_id: 1,
  title_mn: 'Танилцах',
  subtitle_mn: 'N5 суурь',
  icon: 'book',
  order_num: 1,
  is_published: 1,
  word_count: 1,
  progress: null,
};

function n5Chapters(completed = false) {
  return [{
    id: 1,
    title_mn: 'JLPT N5',
    subtitle_mn: 'Суурь',
    color: '#58CC02',
    jlpt_level: 1,
    order_num: 1,
    is_published: 1,
    lessons: [
      {
        ...lesson1,
        progress: completed
          ? { best_accuracy: 0.9, attempts: 1, completed_at: '2026-10-04T00:00:00Z' }
          : null,
      },
      {
        ...lesson1,
        id: 2,
        order_num: 2,
        title_mn: 'Өдөр тутмын яриа',
        progress: null,
      },
    ],
  }];
}

function advancedChapters() {
  return [
    {
      ...n5Chapters(true)[0],
      lessons: n5Chapters(true)[0].lessons.map((l) => ({
        ...l,
        progress: { best_accuracy: 0.9, attempts: 1, completed_at: '2026-10-04T00:00:00Z' },
      })),
    },
    {
      id: 2,
      title_mn: 'JLPT N4',
      subtitle_mn: 'Дунд шат',
      color: '#4C8BF5',
      jlpt_level: 2,
      order_num: 2,
      is_published: 1,
      lessons: [{
        ...lesson1,
        id: 3,
        chapter_id: 2,
        title_mn: 'N4 эхлэл',
        order_num: 1,
        progress: null,
      }],
    },
  ];
}

const lessonDetail = {
  id: 1,
  chapter_id: 1,
  chapter_jlpt_level: 1,
  title_mn: 'Танилцах',
  subtitle_mn: 'N5 суурь',
  icon: 'book',
  order_num: 1,
  words: [word],
  imported_content: {
    external_lesson_id: 'e2e-jp-1',
    title_jp: 'はじめまして',
    title_mn: 'Танилцах',
    source: 'e2e',
    summary: 'Танилцах үед хэрэглэдэг япон хэллэг.',
    dialogues: [],
    vocab: [{ kanji: '私', romaji: 'watashi', meaning_mn: 'би', jlpt_level: 1 }],
    grammar: [],
    slang: [],
    workbook: { sections: [] },
    quizlet_text: '',
  },
  progress: null,
};

async function seedAuthenticated(page: Page, opts?: { level?: string; reason?: string }) {
  await page.addInitScript(({ level, reason }) => {
    localStorage.setItem('auth_token', 'e2e-access-token');
    localStorage.setItem('has_seen_onboarding', 'true');
    localStorage.setItem('jlpt_self_level', level);
    localStorage.setItem('learning_reason', reason);
  }, {
    level: opts?.level ?? 'n5',
    reason: opts?.reason ?? 'career',
  });
}

async function mockApi(
  page: Page,
  opts: {
    action: Action;
    chapters?: ReturnType<typeof n5Chapters>;
    advanceGateOk?: boolean;
    failNextActionOnce?: boolean;
    failLessons?: boolean;
    micWords?: boolean;
  }
) {
  let failNext = Boolean(opts.failNextActionOnce);

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());

    const cors = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:4173',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Request-ID',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Expose-Headers': 'X-Request-ID',
      'Content-Type': 'application/json',
      'X-Request-ID': 'e2e-request',
    };

    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors, body: '' });
      return;
    }

    const ok = async (body: unknown, status = 200) =>
      route.fulfill({ status, headers: cors, body: JSON.stringify(body) });

    if (url.pathname === '/api/user/profile') {
      await ok({ data: { id: 1, email: 'e2e@example.com', display_name: 'E2E', avatar_url: null, is_admin: 0 } });
      return;
    }
    if (url.pathname === '/api/user/preferences') {
      await ok({
        message: 'ok',
        data: {
          self_level: 'n5',
          learning_reason: 'career',
          daily_xp_goal: 30,
          kana_foundation_completed: true,
          placement_level: null,
          placement_completed_at: null,
        },
      });
      return;
    }
    if (url.pathname === '/api/user/dashboard') {
      await ok({
        data: {
          user: { id: 1, email: 'e2e@example.com', display_name: 'E2E', avatar_url: null, is_admin: 0 },
          streak: { current_streak: 2, longest_streak: 4, last_activity_date: '2026-10-04', total_days_studied: 5 },
          stats: { total_xp: 120, words_learned: 20, words_mastered: 10, total_reviews: 30 },
          due_today: 0,
          today_xp: 10,
          daily_xp_goal: 30,
        },
      });
      return;
    }
    if (url.pathname === '/api/user/next-action') {
      if (failNext) {
        failNext = false;
        await ok({ error: 'Түр серверийн алдаа', code: 'TEMPORARY', request_id: 'e2e-request' }, 503);
        return;
      }
      await ok({ data: opts.action });
      return;
    }
    if (url.pathname === '/api/lessons') {
      if (opts.failLessons) {
        await ok({ error: 'Хичээлийн API түр ажиллахгүй байна', code: 'TEMPORARY' }, 503);
        return;
      }
      await ok({ data: opts.chapters ?? n5Chapters(false), advance_gate_ok: opts.advanceGateOk ?? false });
      return;
    }
    if (url.pathname === '/api/lessons/catalog') {
      await ok({ data: opts.chapters ?? n5Chapters(false) });
      return;
    }
    if (url.pathname === '/api/lessons/1') {
      await ok({ data: lessonDetail });
      return;
    }
    if (url.pathname === '/api/words/due' || url.pathname === '/api/user/due-words') {
      await ok({ data: [word] });
      return;
    }
    if (url.pathname === '/api/words') {
      await ok({ data: opts.micWords === false ? [] : [word], total: 1, has_more: false });
      return;
    }
    if (url.pathname === '/api/exams/templates') {
      await ok({ data: [], my_mock: { best_total_score: 0, has_passed: false } });
      return;
    }
    if (url.pathname.startsWith('/api/audio/')) {
      await ok({ error: 'Дуу олдсонгүй', code: 'AUDIO_NOT_FOUND' }, 404);
      return;
    }

    await ok({ data: [] });
  });
}

test('zero learner is directed to kana foundation', async ({ page }) => {
  await seedAuthenticated(page, { level: 'none', reason: 'fun' });
  await mockApi(page, {
    action: {
      kind: 'foundation',
      title: 'Эхлээд кана сууриа тавья',
      subtitle: 'Хирагана, катаканагаа сурч богино шалгалтаар баталгаажуулаарай',
      href: '/kana',
      reason: 'beginner_kana_foundation',
    },
  });

  await page.goto('/home');
  await expect(page.getByText('Эхлээд кана сууриа тавья')).toBeVisible();
  await page.getByRole('button', { name: /Эхлээд кана сууриа тавья/ }).click();
  await expect(page).toHaveURL(/\/kana$/);
  await expect(page.getByText('Кана сууриа шалгах')).toBeVisible();
});

test('returning N5 learner sees due review and truthful progress', async ({ page }) => {
  await seedAuthenticated(page);
  await mockApi(page, {
    action: {
      kind: 'review',
      title: 'Өнөөдрийн давталтаа хийх',
      subtitle: '7 үг давтах хугацаа болсон байна',
      href: '/study/flashcard',
      reason: 'due_srs',
      due_count: 7,
    },
    chapters: n5Chapters(true),
  });

  await page.goto('/home');
  await expect(page.getByText('Өнөөдрийн давталтаа хийх')).toBeVisible();
  await expect(page.getByText('JLPT N5')).toBeVisible();
  await expect(page.getByText('Өдөр тутмын яриа')).toBeVisible();
});

test('advanced learner can see the N4 path after the gate', async ({ page }) => {
  await seedAuthenticated(page, { level: 'n4', reason: 'career' });
  await mockApi(page, {
    action: {
      kind: 'lesson',
      title: 'Дараагийн хичээлээ үргэлжлүүлэх',
      subtitle: 'JLPT замаараа нэг алхам урагшил',
      href: '/lessons/3',
      reason: 'next_unfinished_lesson',
      lesson_id: 3,
    },
    chapters: advancedChapters() as ReturnType<typeof n5Chapters>,
    advanceGateOk: true,
  });

  await page.goto('/home');
  await expect(page.getByText('JLPT N4')).toBeVisible();
  await expect(page.getByText('N4 эхлэл')).toBeVisible();
  await expect(page.getByText('Дараагийн хичээлээ үргэлжлүүлэх')).toBeVisible();
});

test('temporary recommendation failure is visible and retry recovers', async ({ page }) => {
  await seedAuthenticated(page);
  await mockApi(page, {
    action: {
      kind: 'lesson',
      title: 'Дараагийн хичээлээ үргэлжлүүлэх',
      subtitle: 'JLPT замаараа нэг алхам урагшил',
      href: '/lessons/1',
      reason: 'next_unfinished_lesson',
      lesson_id: 1,
    },
    failNextActionOnce: true,
  });

  await page.goto('/home');
  await expect(page.getByText('Төлөвлөгөөг ачаалж чадсангүй')).toBeVisible();
  await page.getByRole('button', { name: 'Дахин оролдох' }).first().click();
  await expect(page.getByText('Дараагийн хичээлээ үргэлжлүүлэх')).toBeVisible();
});

test('expired session returns the learner to login', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('has_seen_onboarding', 'true');
    localStorage.setItem('refresh_token', 'expired-refresh');
  });

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const headers = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:4173',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Content-Type': 'application/json',
    };
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers, body: '' });
      return;
    }
    await route.fulfill({
      status: 401,
      headers,
      body: JSON.stringify({ error: 'Token хүчингүй болсон', code: 'TOKEN_EXPIRED' }),
    });
  });

  await page.goto('/home');
  await expect(page).toHaveURL(/\/login/);
});

test('lesson route survives a hard refresh', async ({ page }) => {
  await seedAuthenticated(page);
  await mockApi(page, {
    action: {
      kind: 'lesson',
      title: 'Дараагийн хичээлээ үргэлжлүүлэх',
      subtitle: 'JLPT замаараа нэг алхам урагшил',
      href: '/lessons/1',
      reason: 'next_unfinished_lesson',
      lesson_id: 1,
    },
  });

  await page.goto('/lessons/1');
  await expect(page.getByText('Танилцах үед хэрэглэдэг япон хэллэг.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Танилцах үед хэрэглэдэг япон хэллэг.')).toBeVisible();
});

test('learn path does not overflow a 360px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await seedAuthenticated(page);
  await mockApi(page, {
    action: {
      kind: 'lesson',
      title: 'Дараагийн хичээлээ үргэлжлүүлэх',
      subtitle: 'JLPT замаараа нэг алхам урагшил',
      href: '/lessons/1',
      reason: 'next_unfinished_lesson',
      lesson_id: 1,
    },
  });

  await page.goto('/home');
  await expect(page.getByText('Таны суралцах зам')).toBeVisible();
  const hasPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  expect(hasPageOverflow).toBe(false);
});

test('practice hub keeps tools out of the main learning path', async ({ page }) => {
  await seedAuthenticated(page);
  await mockApi(page, {
    action: {
      kind: 'review',
      title: 'Өнөөдрийн давталтаа хийх',
      subtitle: '7 үг',
      href: '/study/flashcard',
      reason: 'due_srs',
      due_count: 7,
    },
  });

  await page.goto('/study');
  await expect(page.getByText('Сул чадвараа хүчтэй болго')).toBeVisible();
  await expect(page.getByText('Кана')).toBeVisible();
  await expect(page.getByText('Канжи')).toBeVisible();
  await expect(page.getByText('Ярих')).toBeVisible();
  await expect(page.getByText('JLPT checkpoint')).toBeVisible();
});

test('kana checkpoint can be completed with keyboard only', async ({ page }) => {
  await seedAuthenticated(page, { level: 'none', reason: 'fun' });
  await mockApi(page, {
    action: {
      kind: 'foundation',
      title: 'Эхлээд кана сууриа тавья',
      subtitle: 'Кана',
      href: '/kana',
      reason: 'beginner_kana_foundation',
    },
  });

  await page.goto('/kana/checkpoint');
  await expect(page.getByText(/^1\/12/)).toBeVisible();
  await expect(page.getByText('Вэб: 1–4 = сонгох · Enter = дараах')).toBeVisible();

  const keys = ['1', '2', '2', '3', '3', '3', '1', '1', '2', '4', '4', '2'];
  for (let i = 0; i < keys.length; i += 1) {
    await page.keyboard.press(keys[i]);
    await page.keyboard.press('Enter');

    if (i < keys.length - 1) {
      await expect(page.getByText(new RegExp(`^${i + 2}/12`))).toBeVisible();
    }
  }

  await expect(page.getByText('Суурь бэлэн байна')).toBeVisible();
  await expect(page.getByText('12/12', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'N5 суралцах зам руу орох' })).toBeVisible();
});


test('missing pronunciation audio fails visibly instead of hanging', async ({ page }) => {
  await seedAuthenticated(page);
  await mockApi(page, {
    action: {
      kind: 'review',
      title: 'Өнөөдрийн давталтаа хийх',
      subtitle: '1 үг',
      href: '/study/flashcard',
      reason: 'due_srs',
      due_count: 1,
    },
  });

  await page.goto('/study/flashcard');
  const audioButton = page.getByRole('button', { name: 'Дуудлага сонсох' }).first();
  await expect(audioButton).toBeVisible();
  await audioButton.click();
  await expect(page.getByText('Дууг тоглуулж чадсангүй. Дахин оролдоно уу.')).toBeVisible();
});

test('mic permission denial produces a learner-visible result instead of hanging', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecognition {
      lang = '';
      continuous = true;
      interimResults = true;
      maxAlternatives = 3;
      onstart = null;
      onerror = null;
      onend = null;
      onresult = null;
      start() {}
      stop() {}
      abort() {}
    }
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: FakeRecognition,
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException('Permission denied', 'NotAllowedError');
        },
      },
    });
  });
  await seedAuthenticated(page);
  await mockApi(page, {
    action: {
      kind: 'explore',
      title: 'Ярих',
      subtitle: 'Дуудлага',
      href: '/study/speak',
      reason: 'travel_emphasis',
    },
  });

  await page.goto('/study/speak');
  await expect(page.getByRole('button', { name: 'Микрофон' })).toBeVisible();
  await page.getByRole('button', { name: 'Микрофон' }).click();
  await expect(page.getByText(/Зөвшөөрөл аваагүй/).first()).toBeVisible();
});
