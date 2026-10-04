import { passesJlptN5AdvanceGate } from './jlptGate';
import { studyQueueCount } from './studyQueue';
import { getLearningPreferences, type LearningReason } from './learningPreferences';

export type StudyActionKind = 'review' | 'foundation' | 'lesson' | 'weak_skill' | 'explore';

export type StudyNextAction = {
  kind: StudyActionKind;
  title: string;
  subtitle: string;
  href: string;
  reason: string;
  lesson_id?: number;
  due_count?: number;
  weak_skill?: string;
};

export type StudyRecommendationInput = {
  dueCount: number;
  needsKanaFoundation?: boolean;
  nextLessonId: number | null;
  weakSkill: string | null;
  learningReason?: LearningReason | null;
};

const SKILL_ROUTES: Record<string, { href: string; title: string; subtitle: string }> = {
  listening: {
    href: '/study/speak',
    title: 'Сонсох, ярих чадвараа бэхжүүлэх',
    subtitle: 'Япон дуудлагаа сонсож, давтаж хэлээрэй',
  },
  pronunciation: {
    href: '/study/speak',
    title: 'Дуудлагаа сайжруулах',
    subtitle: 'Микрофоноор ярьж, дуудлагын дасгал хийгээрэй',
  },
  pitch: {
    href: '/study/speak',
    title: 'Аялга, дуудлагаа сайжруулах',
    subtitle: 'Япон хэлний аялга, дуудлага дээр ажиллаарай',
  },
  tones: {
    href: '/study/speak',
    title: 'Аялга, дуудлагаа сайжруулах',
    subtitle: 'Япон хэлний аялга, дуудлага дээр ажиллаарай',
  },
  recall: {
    href: '/study/weak',
    title: 'Сул үгсээ сэргээх',
    subtitle: 'Мартагдаж байгаа үгсээ богино давталтаар сэргээгээрэй',
  },
  reading: {
    href: '/study/grammar',
    title: 'Унших чадвараа бэхжүүлэх',
    subtitle: 'Дүрэм, өгүүлбэрийн бүтэц дээр ажиллаарай',
  },
  stroke: {
    href: '/study/writer',
    title: 'Канжи бичлэгээ сайжруулах',
    subtitle: 'Зураасны дарааллаар канжи бичих дадлага хийгээрэй',
  },
};

export function selectStudyAction(input: StudyRecommendationInput): StudyNextAction {
  if (input.dueCount > 0) {
    return {
      kind: 'review',
      title: 'Өнөөдрийн давталтаа хийх',
      subtitle: `${input.dueCount} үг давтах хугацаа болсон байна`,
      href: '/study/flashcard',
      reason: 'due_srs',
      due_count: input.dueCount,
    };
  }

  if (input.needsKanaFoundation) {
    return {
      kind: 'foundation',
      title: 'Эхлээд кана сууриа тавья',
      subtitle: 'Хирагана, катаканагаа сурч богино шалгалтаар баталгаажуулаарай',
      href: '/kana',
      reason: 'beginner_kana_foundation',
    };
  }

  if (input.nextLessonId != null) {
    return {
      kind: 'lesson',
      title: 'Дараагийн хичээлээ үргэлжлүүлэх',
      subtitle: 'JLPT замаараа нэг алхам урагшил',
      href: `/lessons/${input.nextLessonId}`,
      reason: 'next_unfinished_lesson',
      lesson_id: input.nextLessonId,
    };
  }

  if (input.weakSkill) {
    const skill = SKILL_ROUTES[input.weakSkill] ?? SKILL_ROUTES.recall;
    return {
      kind: 'weak_skill',
      title: skill.title,
      subtitle: skill.subtitle,
      href: skill.href,
      reason: 'weakest_measured_skill',
      weak_skill: input.weakSkill,
    };
  }

  if (input.learningReason === 'travel') {
    return {
      kind: 'explore',
      title: 'Аяллын ярианы чадвараа ахиулах',
      subtitle: 'Сонсож, дагаж хэлэх богино ярианы дасгал хийгээрэй',
      href: '/study/speak',
      reason: 'travel_emphasis',
    };
  }

  if (input.learningReason === 'university' || input.learningReason === 'career') {
    return {
      kind: 'explore',
      title: 'Унших, дүрмийн чадвараа ахиулах',
      subtitle: 'Өгүүлбэрийн бүтэц, дүрмийн дасгалаа үргэлжлүүлээрэй',
      href: '/study/grammar',
      reason: 'reading_formal_emphasis',
    };
  }

  if (input.learningReason === 'culture' || input.learningReason === 'fun') {
    return {
      kind: 'explore',
      title: 'Сурсан үгээрээ япон текст унших',
      subtitle: 'AI уншлагаар мэддэг үгээ бодит өгүүлбэрт бататгаарай',
      href: '/study/ai-reading',
      reason: 'culture_media_emphasis',
    };
  }

  return {
    kind: 'explore',
    title: 'Япон хэлний сууриа бататгах',
    subtitle: 'Хирагана, катакана болон суурь чадвараа давтаарай',
    href: '/kana',
    reason: 'safe_exploration_fallback',
  };
}

async function findNextLessonId(db: D1Database, userId: number): Promise<number | null> {
  const gateOk = await passesJlptN5AdvanceGate(db, userId);
  const row = await db
    .prepare(
      `SELECT l.id
       FROM lessons l
       JOIN chapters c ON c.id = l.chapter_id
       LEFT JOIN user_lesson_progress p
         ON p.lesson_id = l.id AND p.user_id = ?
       WHERE l.is_published = 1
         AND c.is_published = 1
         AND p.completed_at IS NULL
         AND (? = 1 OR c.jlpt_level = 1)
       ORDER BY c.jlpt_level ASC, c.order_num ASC, l.order_num ASC
       LIMIT 1`
    )
    .bind(userId, gateOk ? 1 : 0)
    .first<{ id?: number }>();

  return row?.id == null ? null : Number(row.id);
}

async function findWeakestSkill(db: D1Database, userId: number): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT skill, hits, total
       FROM user_skill_stats
       WHERE user_id = ? AND total >= 3
       ORDER BY (CAST(hits AS REAL) / NULLIF(total, 0)) ASC, total DESC
       LIMIT 1`
    )
    .bind(userId)
    .first<{ skill?: string }>();

  return row?.skill ?? null;
}

export async function getStudyNextAction(
  db: D1Database,
  userId: number
): Promise<StudyNextAction> {
  const dueCount = await studyQueueCount(db, userId);
  const preferences = await getLearningPreferences(db, userId);
  if (dueCount > 0) {
    return selectStudyAction({
      dueCount,
      needsKanaFoundation: false,
      nextLessonId: null,
      weakSkill: null,
      learningReason: preferences.learning_reason,
    });
  }

  const needsKanaFoundation =
    preferences.self_level === 'none' && !preferences.kana_foundation_completed;
  if (needsKanaFoundation) {
    return selectStudyAction({
      dueCount: 0,
      needsKanaFoundation: true,
      nextLessonId: null,
      weakSkill: null,
      learningReason: preferences.learning_reason,
    });
  }

  const nextLessonId = await findNextLessonId(db, userId);
  if (nextLessonId != null) {
    return selectStudyAction({
      dueCount: 0,
      needsKanaFoundation: false,
      nextLessonId,
      weakSkill: null,
      learningReason: preferences.learning_reason,
    });
  }

  const weakSkill = await findWeakestSkill(db, userId);
  return selectStudyAction({
    dueCount: 0,
    needsKanaFoundation: false,
    nextLessonId: null,
    weakSkill,
    learningReason: preferences.learning_reason,
  });
}
