import {
  DEFAULT_PREFERENCES,
  type CourseEvent,
  type Preferences,
  type Task,
} from './types';
import {
  COURSE_STAGES,
  HIRAGANA_PLACEMENT,
  LESSONS,
  LESSON_BY_ID,
  REQUIRED_TASKS,
  WORDS,
  lessonQuestions,
  wordQuestions,
  writingCharacters,
} from './content';
export function localDay(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validPreferences(raw: unknown): raw is Preferences {
  if (!raw || typeof raw !== 'object') return false;
  const p = raw as Preferences;
  if (
    ![10, 20, 30, 45, 60].includes(p.minutes) ||
    !Number.isInteger(p.daysPerWeek) ||
    p.daysPerWeek < 1 ||
    p.daysPerWeek > 7 ||
    !['N1', 'N2', 'N3', 'N4', 'N5'].includes(p.target)
  )
    return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: p.timezone }).format();
    return typeof p.timezone === 'string';
  } catch {
    return false;
  }
}
export function quizAccuracy(
  questions: { answer: number }[],
  answers?: number[],
): number {
  if (!questions.length || !answers || answers.length !== questions.length)
    return 0;
  return (
    questions.filter((q, i) => q.answer === answers[i]).length /
    questions.length
  );
}
export function passedTask(e: CourseEvent): boolean {
  if (e.kind !== 'task') return false;
  const l = LESSON_BY_ID.get(e.lessonId);
  if (!l) return false;
  if (e.task === 'words')
    return quizAccuracy(wordQuestions(l.words), e.answers) >= 0.8;
  if (e.task === 'quiz')
    return quizAccuracy(lessonQuestions(l), e.answers) >= 0.8;
  if (e.task === 'reading')
    return quizAccuracy([l.readingQuestion], e.answers) === 1;
  if (e.task === 'listening')
    return quizAccuracy(wordQuestions(l.words).slice(0, 3), e.answers) >= 0.8;
  if (e.task === 'writing')
    return writingCharacters(l).every((c) => e.characters?.includes(c));
  // Speech is transcript evidence only, never used to unlock courses or predict acoustic quality.
  return false;
}
export function hiraPlaced(events: readonly CourseEvent[]): boolean {
  return events.some(
    (e) =>
      e.kind === 'placement' &&
      quizAccuracy(HIRAGANA_PLACEMENT, e.answers) >= 0.9,
  );
}
export function taskDone(
  events: readonly CourseEvent[],
  lessonId: string,
  task: Task,
): boolean {
  return events.some(
    (e) =>
      e.kind === 'task' &&
      e.lessonId === lessonId &&
      e.task === task &&
      passedTask(e),
  );
}
export function mastered(
  events: readonly CourseEvent[],
  lessonId: string,
): boolean {
  return REQUIRED_TASKS.every((t) => taskDone(events, lessonId, t));
}
export function nextLesson(events: readonly CourseEvent[]) {
  const placed = hiraPlaced(events);
  return (
    LESSONS.find(
      (l) => !(placed && l.stage === 'hiragana') && !mastered(events, l.id),
    ) ?? null
  );
}
export function canStudy(
  events: readonly CourseEvent[],
  lessonId: string,
): boolean {
  const index = LESSONS.findIndex((l) => l.id === lessonId);
  if (index < 0) return false;
  const placed = hiraPlaced(events);
  return LESSONS.slice(0, index).every(
    (l) => (placed && l.stage === 'hiragana') || mastered(events, l.id),
  );
}
export function planForDay(events: readonly CourseEvent[], day: string) {
  return (
    events
      .filter(
        (e): e is Extract<CourseEvent, { kind: 'plan' }> =>
          e.kind === 'plan' && e.day === day,
      )
      .sort(
        (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
      )[0] ?? null
  );
}
export type ReviewCard = {
  wordId: string;
  due: string;
  interval: number;
  repetitions: number;
  lapses: number;
};
export function reviewCards(events: readonly CourseEvent[]): ReviewCard[] {
  const cards = new Map<string, ReviewCard>();
  for (const e of [...events].sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  )) {
    if (e.kind === 'task' && e.task === 'words' && passedTask(e)) {
      for (const w of LESSON_BY_ID.get(e.lessonId)!.words)
        if (!cards.has(w.id))
          cards.set(w.id, {
            wordId: w.id,
            due: new Date(Date.parse(e.at) + 86400000).toISOString(),
            interval: 1,
            repetitions: 0,
            lapses: 0,
          });
    }
    if (e.kind === 'review') {
      const card = cards.get(e.wordId);
      if (!card) continue;
      const failed = e.rating === 0;
      const interval = failed
        ? 0
        : e.rating === 1
          ? 1
          : card.repetitions === 0
            ? e.rating === 3
              ? 4
              : 2
            : Math.min(
                365,
                Math.max(
                  1,
                  Math.round(card.interval * (e.rating === 3 ? 2.5 : 1.8)),
                ),
              );
      cards.set(e.wordId, {
        ...card,
        interval,
        repetitions: failed ? 0 : card.repetitions + 1,
        lapses: card.lapses + (failed ? 1 : 0),
        due: new Date(
          Date.parse(e.at) + (failed ? 600000 : interval * 86400000),
        ).toISOString(),
      });
    }
  }
  return [...cards.values()];
}
export function dueReviews(
  events: readonly CourseEvent[],
  now: Date,
): string[] {
  return reviewCards(events)
    .filter((c) => c.due <= now.toISOString())
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 20)
    .map((c) => c.wordId);
}
export function mergeEvents(
  a: readonly CourseEvent[],
  b: readonly CourseEvent[],
): CourseEvent[] {
  const map = new Map<string, CourseEvent>();
  for (const e of [...a, ...b]) if (!map.has(e.id)) map.set(e.id, e);
  return [...map.values()].sort(
    (x, y) => x.at.localeCompare(y.at) || x.id.localeCompare(y.id),
  );
}
export function validateEvent(raw: unknown): raw is CourseEvent {
  if (!raw || typeof raw !== 'object') return false;
  const e = raw as CourseEvent;
  if (
    typeof e.id !== 'string' ||
    !/^[a-zA-Z0-9_-]{8,80}$/.test(e.id) ||
    typeof e.at !== 'string' ||
    !Number.isFinite(Date.parse(e.at)) ||
    Date.parse(e.at) > Date.now() + 300000 ||
    typeof e.day !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(e.day)
  )
    return false;
  if (
    new Date(e.at).toISOString() !== e.at ||
    !Number.isFinite(Date.parse(e.day + 'T00:00:00Z')) ||
    new Date(e.day + 'T00:00:00Z').toISOString().slice(0, 10) !== e.day
  )
    return false;
  const answersOk = (a: unknown, n: number) =>
    Array.isArray(a) &&
    a.length === n &&
    a.every((x) => Number.isInteger(x) && x >= 0 && x < 8);
  if (e.kind === 'placement')
    return answersOk(e.answers, HIRAGANA_PLACEMENT.length);
  if (e.kind === 'review')
    return WORDS.has(e.wordId) && [0, 1, 2, 3].includes(e.rating);
  if (e.kind === 'study')
    return Number.isInteger(e.seconds) && e.seconds > 0 && e.seconds <= 300;
  const l = LESSON_BY_ID.get(e.lessonId);
  if (!l) return false;
  if (e.kind === 'plan')
    return (
      Array.isArray(e.reviews) &&
      e.reviews.length <= 20 &&
      e.reviews.every((id) => WORDS.has(id))
    );
  if (e.kind !== 'task') return false;
  if (e.task === 'writing')
    return (
      Array.isArray(e.characters) &&
      e.characters.length <= 40 &&
      e.characters.every(
        (c) => typeof c === 'string' && writingCharacters(l).includes(c),
      )
    );
  if (e.task === 'speaking')
    return (
      typeof e.transcript === 'string' &&
      e.transcript.length > 0 &&
      e.transcript.length <= 500
    );
  const counts = {
    words: l.words.length,
    reading: 1,
    quiz: lessonQuestions(l).length,
    listening: Math.min(3, l.words.length),
  };
  return (
    e.task in counts &&
    answersOk(e.answers, counts[e.task as keyof typeof counts])
  );
}
export function parseSaved(raw: string | null): {
  events: CourseEvent[];
  preferences: Preferences;
} {
  if (raw)
    try {
      const s = JSON.parse(raw);
      if (
        s?.version === 1 &&
        Array.isArray(s.events) &&
        s.events.length <= 20000 &&
        s.events.every(validateEvent)
      )
        return {
          events: mergeEvents([], s.events),
          preferences: validPreferences(s.preferences)
            ? s.preferences
            : DEFAULT_PREFERENCES,
        };
    } catch {
      /* Recover with a clean state; caller preserves the original for export. */
    }
  return { events: [], preferences: DEFAULT_PREFERENCES };
}
export function milestones(
  events: readonly CourseEvent[],
  preferences: Preferences,
  now = new Date(),
) {
  // Planning ranges are editable product assumptions, NOT official JLPT required hours.
  const hours: Record<string, [number, number]> = {
    N5: [250, 450],
    N4: [500, 800],
    N3: [900, 1400],
    N2: [1600, 2400],
    N1: [2400, 3600],
  };
  const activeDays = new Set(
    events.filter((e) => e.kind === 'task' && passedTask(e)).map((e) => e.day),
  ).size;
  const weeksElapsed = events.length
    ? Math.max(
        1,
        (now.getTime() - Math.min(...events.map((e) => Date.parse(e.at)))) /
          604800000,
      )
    : 0;
  const observedDays =
    weeksElapsed >= 2
      ? Math.min(
          preferences.daysPerWeek,
          Math.max(0.5, activeDays / weeksElapsed),
        )
      : preferences.daysPerWeek;
  const weekly = (preferences.minutes / 60) * observedDays;
  const estimate = (h: number) => {
    const d = new Date(now.getTime() + (h / weekly) * 604800000);
    return d.toISOString().slice(0, 10);
  };
  const studiedHours =
    events.reduce((n, e) => n + (e.kind === 'study' ? e.seconds : 0), 0) / 3600;
  return Object.entries(hours).map(([level, [low, high]]) => ({
    level,
    low,
    high,
    earliest: estimate(Math.max(0, low - studiedHours)),
    latest: estimate(Math.max(0, high - studiedHours)),
    observedDays,
  }));
}

/** Course evidence only. Recognition placement and learned task completion stay separate. */
export function stageProgress(events: readonly CourseEvent[]) {
  return COURSE_STAGES.map((stage) => {
    const lessons = LESSONS.filter((lesson) => lesson.stage === stage);
    const introduced = lessons.filter((lesson) => taskDone(events, lesson.id, 'words'));
    const written = lessons.filter((lesson) => taskDone(events, lesson.id, 'writing'));
    const uniqueWords = (items: typeof lessons) => new Set(
      items.flatMap((lesson) => lesson.words.map((word) => word.jp + '\u0000' + word.kana)),
    ).size;
    return {
      stage,
      total: lessons.length,
      completed: lessons.filter((lesson) => mastered(events, lesson.id)).length,
      placement: stage === 'hiragana' && hiraPlaced(events),
      words: uniqueWords(introduced),
      totalWords: uniqueWords(lessons),
      characters: new Set(written.flatMap(writingCharacters)).size,
      totalCharacters: new Set(lessons.flatMap(writingCharacters)).size,
      listening: lessons.filter((lesson) => taskDone(events, lesson.id, 'listening')).length,
    };
  });
}
