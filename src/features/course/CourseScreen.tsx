import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getKanaRomaji } from '@src/lib/content/kanaRomaji';
import { useAuth } from '@src/context/AuthContext';
import {
  DEFAULT_PREFERENCES,
  HIRAGANA_PLACEMENT,
  KANJI,
  LESSONS,
  LESSON_BY_ID,
  REQUIRED_TASKS,
  WORDS,
  canStudy,
  dueReviews,
  hiraPlaced,
  lessonQuestions,
  localDay,
  mastered,
  milestones,
  nextLesson,
  planForDay,
  reviewCards,
  taskDone,
  wordQuestions,
  writingCharacters,
  JLPT,
  JLPT_SOURCE,
  type CourseEvent,
  type Lesson,
  type Task,
  type Preferences,
} from '../../../packages/curriculum/src';
import { useCourse, type CourseStore } from './useCourse';
import { Quiz, Speaking, StrokeTutor, speakJapanese } from './Exercises';
import './course.css';
import { stopJapaneseAudio } from './japaneseAudio';
import { KanjiDictionary } from './KanjiDictionary';
const TASK_NAMES: Record<Task, string> = {
  words: 'Шинэ үг',
  reading: 'Уншлага',
  writing: 'Бичлэг',
  quiz: 'Бататгах',
  listening: 'Сонсгол',
  speaking: 'Ярианы дадлага',
};
const TASK_MINUTES: Record<Task, number> = {
  words: 4,
  reading: 4,
  writing: 6,
  quiz: 3,
  listening: 2,
  speaking: 1,
};
function dateLabel(d: string) {
  const [y, m, day] = d.split('-').map(Number);
  return `${y} оны ${m} сарын ${day}`;
}

function account(token: string | null) {
  try {
    return JSON.parse(
      atob(token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    ).sub;
  } catch {
    return 'guest';
  }
}
export default function CourseScreen() {
  const { token } = useAuth();
  return <CourseWorkspace key={account(token)} />;
}
function CourseWorkspace() {
  const store = useCourse();
  const { events, preferences, add } = store;
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'today';
  const [clock, setClock] = useState(new Date());
  const [active, setActive] = useState<{ lessonId: string; task: Task } | null>(
    null,
  );
  const [placement, setPlacement] = useState(false);
  const [audioError, setAudioError] = useState('');
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const day = localDay(clock, preferences.timezone),
    plan = planForDay(events, day),
    next = nextLesson(events);
  const lesson = plan ? LESSON_BY_ID.get(plan.lessonId) : next;
  const dailyReviews = plan?.reviews ?? dueReviews(events, clock);
  const done = lesson
    ? REQUIRED_TASKS.filter((t) => taskDone(events, lesson.id, t)).length
    : 0;
  const learned = LESSONS.filter((l) => mastered(events, l.id)).length;
  const [recentImport, setRecentImport] = useState('');
  // Count actual active study time; stop when hidden or after 90 seconds without interaction.
  const addRef = useRef(add);
  addRef.current = add;
  useEffect(() => {
    if (!active && !placement) return;
    let last = Date.now(),
      seconds = 0;
    const touch = () => {
      last = Date.now();
    };
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - last < 90000)
        seconds++;
      if (seconds >= 60) {
        addRef.current({ kind: 'study', seconds: 60 });
        seconds = 0;
      }
    }, 1000);
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    window.addEventListener('touchstart', touch);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
      window.removeEventListener('touchstart', touch);
      if (seconds > 0) addRef.current({ kind: 'study', seconds });
    };
  }, [active?.lessonId, active?.task, placement]);
  const begin = (l: Lesson, t: Task) => {
    if (!canStudy(events, l.id)) return;
    if (!plan)
      add({
        kind: 'plan',
        lessonId: l.id,
        reviews: dueReviews(events, new Date()),
      });
    setActive({ lessonId: l.id, task: t });
    setPlacement(false);
  };
  useEffect(() => () => stopJapaneseAudio(), [active?.lessonId, active?.task, placement, tab]);
  const chooseTab = (value: string) => {
    setParams({ tab: value });
    setActive(null);
    setPlacement(false);
  };
  return (
    <div className="course-page">
      <header className="course-header">
        <div>
          <p className="course-kicker">NIHONGO · НЭГ ӨДӨР, НЭГ АЛХАМ</p>
          <h1>
            Япон хэлний дэвтэр<span lang="ja">日本語</span>
          </h1>
          <p>Хирагана → катакана → үг → ханз → N5 суурь</p>
        </div>
        <div className="course-header-meta">
          <span>{preferences.minutes} мин / өдөр</span>
          <strong>
            {learned} / {LESSONS.length} хичээл
          </strong>
        </div>
      </header>
      <nav className="course-tabs" aria-label="Сургалтын хэсгүүд">
        {[
          ['today', 'Өнөөдөр'],
          ['lessons', 'Хөтөлбөр'],
          ['library', 'Үг ба ханз'],
          ['milestones', 'JLPT зам'],
          ['settings', 'Төлөвлөгөө'],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => chooseTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {!isAuthenticated && (
        <p className="course-banner">
          Бүртгэлгүйгээр суралцаж болно. Явц энэ хөтөч дээр хадгалагдана.{' '}
          <Link to="/register">Бүртгэл үүсгэх</Link> · Төхөөрөмж солихоосоо өмнө
          явцаа экспортлоорой.
        </p>
      )}
      {store.notice.includes('үргэлжлүүлж болно') && (
        <p role="status" className="course-banner">
          {store.notice}{' '}
          <button disabled={store.syncing} onClick={() => void store.sync()}>
            Дахин холбох
          </button>
        </p>
      )}
      {store.storageError && (
        <p role="alert" className="course-banner">
          {store.storageError}
        </p>
      )}
      {active ? (
        <section className="course-card course-workspace">
          <button className="course-back" onClick={() => setActive(null)}>
            ← Өдрийн төлөвлөгөө
          </button>
          <TaskView
            key={`${active.lessonId}-${active.task}`}
            store={store}
            lesson={LESSON_BY_ID.get(active.lessonId)!}
            task={active.task}
          />
        </section>
      ) : placement ? (
        <section className="course-card course-workspace">
          <button onClick={() => setPlacement(false)}>← Буцах</button>
          <h2>Хирагана таних шалгалт</h2>
          <p>
            46 үндсэн үсгээс 90% зөв бол катаканагаас үргэлжлүүлнэ. Энэ нь унших
            хурд, бичлэгийн шалгалт биш. Давтах хичээлүүд нээлттэй үлдэнэ.
          </p>
          <Quiz
            questions={HIRAGANA_PLACEMENT}
            minAccuracy={0.9}
            onPass={(answers) => {
              if (
                answers.filter((a, i) => a === HIRAGANA_PLACEMENT[i].answer)
                  .length /
                  46 >=
                0.9
              ) {
                add({ kind: 'placement', answers });
                setPlacement(false);
              }
            }}
          />
        </section>
      ) : (
        <>
          {tab === 'today' && (
            <>
              <section className="course-hero">
                <div>
                  <p className="course-kicker">
                    {dateLabel(day)} · {preferences.timezone}
                  </p>
                  <h2>
                    {lesson ? lesson.title : 'Суурь хөтөлбөрөө дуусгалаа'}
                  </h2>
                  <p>
                    {lesson?.objective ??
                      'N5-ийн суурь нэгжүүд дууссан. Энэ нь JLPT N5 тэнцсэн гэсэн баталгаа биш. Давталт, бүтэн хэмжээний сорил болон сонсголоо үргэлжлүүлээрэй.'}
                  </p>
                  {lesson && (
                    <button
                      className="course-primary"
                      onClick={() =>
                        begin(
                          lesson,
                          REQUIRED_TASKS.find(
                            (t) => !taskDone(events, lesson.id, t),
                          ) ?? 'reading',
                        )
                      }
                    >
                      {done === 4 ? 'Хичээлээ дахин давтах' : 'Хичээлээ эхлэх'}{' '}
                      →
                    </button>
                  )}
                </div>
                <div
                  className="course-ring"
                  style={
                    { '--progress': `${done * 25}%` } as React.CSSProperties
                  }
                >
                  <div>
                    <strong>{done}/4</strong>
                    <span>үндсэн дасгал</span>
                  </div>
                </div>
              </section>
              {!hiraPlaced(events) &&
                !events.some((e) => e.kind === 'task') && (
                  <section className="course-card course-placement">
                    <div>
                      <h3>Хираганагаа аль хэдийн мэдэх үү?</h3>
                      <p>
                        Үсгээ давтан таних шалгалт өгөөд катаканагаас эхэлж
                        болно.
                      </p>
                    </div>
                    <button onClick={() => setPlacement(true)}>
                      Мэдлэгээ шалгах
                    </button>
                  </section>
                )}
              <div className="course-daily-grid">
                <section className="course-card">
                  <div className="course-section-head">
                    <h2>Өнөөдрийн дараалал</h2>
                    <span>Үндсэн 4 + нэмэлт 2</span>
                  </div>
                  {lesson ? (
                    <ol className="course-task-list">
                      {(
                        [
                          'words',
                          'reading',
                          'writing',
                          'quiz',
                          'listening',
                          'speaking',
                        ] as Task[]
                      ).map((t, i) => {
                        const complete = taskDone(events, lesson.id, t);
                        return (
                          <li key={t}>
                            <span
                              className={
                                complete ? 'course-step is-done' : 'course-step'
                              }
                            >
                              {complete ? '✓' : i + 1}
                            </span>
                            <div>
                              <strong>{TASK_NAMES[t]}</strong>
                              <small>
                                {Math.max(
                                  1,
                                  Math.round(
                                    (TASK_MINUTES[t] * preferences.minutes) /
                                      20,
                                  ),
                                )}{' '}
                                мин · {i < 4 ? 'Үндсэн' : 'Нэмэлт'}
                                {t === 'words'
                                  ? ` · ${lesson.words.length} үг`
                                  : t === 'writing'
                                    ? ` · ${writingCharacters(lesson).join(' ')}`
                                    : ''}
                              </small>
                            </div>
                            <button
                              aria-label={`${TASK_NAMES[t]} эхлэх`}
                              onClick={() => begin(lesson, t)}
                            >
                              {complete ? 'Давтах' : 'Эхлэх'}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p>Дууссан хичээлээ хөтөлбөр хэсгээс сонгож давтаарай.</p>
                  )}
                  <p className="course-subtle">
                    Хугацаа нь баримжаа. Үндсэн дасгалуудыг зөв хийсэн үед
                    хичээл нээгдэнэ. 20 минут хүрэхгүй бол завсарлаад
                    үргэлжлүүлж болно.
                  </p>
                </section>
                <section className="course-card">
                  <h2>Мартахын өмнө давтах</h2>
                  <ReviewPanel store={store} ids={dailyReviews} />
                  <hr />
                  <h3>Өнөөдрийн шинэ үгс</h3>
                  {lesson?.words.map((w) => (
                    <div className="course-word-row" key={w.id}>
                      <span>
                        <b lang="ja">{w.jp}</b>
                        <small lang="ja">{w.kana}</small>
                      </span>
                      <span>{w.mn}</span>
                      <button
                        aria-label={`${w.kana} сонсох`}
                        onClick={() => speakJapanese(w.kana, setAudioError)}
                      >
                        ▶
                      </button>
                    </div>
                  ))}
                  {audioError && <p role="alert">{audioError}</p>}
                  <h3>Өнөөдрийн шинэ ханз / үсэг</h3>
                  <div className="course-glyph-row">
                    {writingCharacters(lesson ?? LESSONS[0]).map((c) => (
                      <button
                        lang="ja"
                        key={c}
                        onClick={() => chooseTab('library')}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
              {done === 4 && lesson && (
                <div className="course-success" role="status">
                  <h3>Өнөөдрийн үндсэн алхмуудаа дуусгалаа.</h3>
                  <p>
                    Давталтаа хийгээд амарч болно. Маргааш дараагийн хичээл
                    төлөвлөгөөнд орно.
                  </p>
                </div>
              )}
            </>
          )}
          {tab === 'lessons' && (
            <section className="course-card">
              <h2>Таны суралцах дараалал</h2>
              <p>
                50 нэгж нь кана ба N5-ийн суурь агуулга. Бүх N5 үгийн сан болон
                N4–N1-ийн бүрэн курс гэж тооцохгүй.
              </p>
              {(['hiragana', 'katakana', 'n5'] as const).map((stage) => (
                <section className="course-stage" key={stage}>
                  <h3>
                    {stage === 'hiragana'
                      ? '01 · Хирагана'
                      : stage === 'katakana'
                        ? '02 · Катакана'
                        : '03 · N5 суурь'}
                  </h3>
                  <div className="course-lesson-grid">
                    {LESSONS.filter((l) => l.stage === stage).map((l) => {
                      const done = mastered(events, l.id),
                        unlocked = canStudy(events, l.id);
                      return (
                        <button
                          className="course-lesson-tile"
                          key={l.id}
                          disabled={!unlocked}
                          onClick={() => begin(l, 'words')}
                        >
                          <span>
                            {done
                              ? '✓'
                              : !unlocked
                                ? '🔒'
                                : l.glyphs.slice(0, 3).join(' ')}
                          </span>
                          <strong>{l.title}</strong>
                          <small>
                            {done
                              ? 'Үндсэн дасгалууд дууссан'
                              : stage === 'hiragana' && hiraPlaced(events)
                                ? 'Таних шалгалтаар баталсан'
                                : unlocked
                                  ? 'Эхлэх боломжтой'
                                  : 'Өмнөх хичээлээ дуусгаарай'}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </section>
          )}
          {tab === 'library' && <Library />}
          {tab === 'milestones' && <Milestones store={store} />}
          {tab === 'settings' && (
            <section className="course-card">
              <h2>Өөрийн хэмнэлээр сурах</h2>
              <Settings store={store} />
              <hr />
              <h3>Явцаа авч явах</h3>
              {isAuthenticated && (
                <button
                  onClick={() => {
                    try {
                      const raw = localStorage.getItem(
                        'nihongo.course.v1.guest',
                      );
                      if (!raw)
                        throw Error(
                          'Энэ хөтөч дээр бүртгэлгүй суралцсан явц алга.',
                        );
                      store.importProgress(raw);
                      setRecentImport(
                        'Бүртгэлгүй үеийн явцыг энэ бүртгэлд нэгтгэлээ.',
                      );
                    } catch (e) {
                      setRecentImport((e as Error).message);
                    }
                  }}
                >
                  Энэ хөтөч дээрх бүртгэлгүй явцыг нэгтгэх
                </button>
              )}
              <p>
                Экспортод сургалтын явц, тохиргоо орно. Нэвтрэх токен, дууны
                бичлэг орохгүй.
              </p>
              <div className="course-actions">
                <button
                  onClick={() => {
                    const blob = new Blob(
                      [
                        JSON.stringify(
                          { version: 1, events, preferences },
                          null,
                          2,
                        ),
                      ],
                      { type: 'application/json' },
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `nihongo-progress-${day}.json`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  Явцаа экспортлох
                </button>
                <label className="course-file">
                  Экспорт сэргээх
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={async (e) => {
                      try {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5000000)
                          throw Error('Файл 5 MB-аас том байна.');
                        store.importProgress(await file.text());
                        setRecentImport('Явцыг нэгтгэж сэргээв.');
                      } catch (err) {
                        setRecentImport(
                          err instanceof Error
                            ? err.message
                            : 'Сэргээж чадсангүй.',
                        );
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <p role="status">{recentImport}</p>
              {isAuthenticated && (
                <button
                  disabled={store.syncing}
                  onClick={() => void store.sync()}
                >
                  {store.syncing
                    ? 'Ижил болгож байна…'
                    : 'Төхөөрөмжүүдийн явцыг ижил болгох'}
                </button>
              )}
              <p role="status">{store.notice}</p>
              <p className="course-subtle">
                Хичээлийн явц, давталт, өдөр тутмын хэмнэлээ эндээс удирдана.
              </p>
            </section>
          )}
        </>
      )}
      <footer className="course-footer">
        <span>Нэг өдөр мартсан ч зам чинь хэвээр.</span>
        <Link to="/study">Бусад дадлага</Link>
        <Link to="/home">Нүүр</Link>
      </footer>
    </div>
  );
}
function TaskView({
  store,
  lesson,
  task,
}: {
  store: CourseStore;
  lesson: Lesson;
  task: Task;
}) {
  const [showRomaji, setShowRomaji] = useState(false),
    [showTranslation, setShowTranslation] = useState(false),
    [audioError, setAudioError] = useState('');
  const [written, setWritten] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const characters = writingCharacters(lesson),
    character = characters[index];
  const done = taskDone(store.events, lesson.id, task);
  const record = (answers: number[]) =>
    store.add({ kind: 'task', lessonId: lesson.id, task, answers });
  return (
    <>
      <p className="course-kicker">
        {lesson.stage === 'hiragana'
          ? 'ХИРАГАНА'
          : lesson.stage === 'katakana'
            ? 'КАТАКАНА'
            : 'N5'}{' '}
        · {TASK_NAMES[task]}
      </p>
      <h2>{lesson.title}</h2>
      {done && (
        <p className="course-success" role="status">
          Энэ дасгал хадгалагдсан. Давтаж болно.
        </p>
      )}
      {task === 'words' && (
        <>
          <p>
            Үгийг сонсоод, утгыг тогтоогоорой. Дараа нь доорх асуултаар өөрийгөө
            шалгана.
          </p>
          <button
            onClick={() => setShowRomaji(!showRomaji)}
            aria-pressed={showRomaji}
          >
            Romaji {showRomaji ? 'нуух' : 'харуулах'}
          </button>
          {lesson.stage !== 'n5' && (
            <div className="course-glyph-grid" style={{ marginTop: 20 }}>
              {lesson.glyphs.map((c) => (
                <button
                  key={c}
                  aria-label={`${c} авиа сонсох`}
                  onClick={() => speakJapanese(c, setAudioError)}
                >
                  <span lang="ja">{c}</span>
                  <small style={{ display: 'block', fontSize: 12 }}>
                    {getKanaRomaji(c)}
                  </small>
                </button>
              ))}
            </div>
          )}
          <div className="course-vocab-grid">
            {lesson.words.map((w) => (
              <article key={w.id}>
                <h3 lang="ja">{w.jp}</h3>
                <p lang="ja">{w.kana}</p>
                {showRomaji && <p>{w.romaji}</p>}
                <strong>{w.mn}</strong>
                <button
                  aria-label={`${w.kana} сонсох`}
                  onClick={() => speakJapanese(w.kana, setAudioError)}
                >
                  ▶ Сонсох
                </button>
              </article>
            ))}
          </div>
          <Quiz questions={wordQuestions(lesson.words)} onPass={record} />
        </>
      )}
      {task === 'reading' && (
        <>
          <p>
            Эхлээд орчуулгагүйгээр тайван унш. Эргэлзсэн үсгээ тусад нь давтаад
            дахин уншаарай.
          </p>
          <div className="course-passage" lang="ja">
            {lesson.passage}
          </div>
          <div className="course-actions">
            <button
              onClick={() => speakJapanese(lesson.passage, setAudioError)}
            >
              ▶ Жишиг уншлага
            </button>
            <button
              aria-expanded={showTranslation}
              onClick={() => setShowTranslation(!showTranslation)}
            >
              Утгыг {showTranslation ? 'нуух' : 'харах'}
            </button>
          </div>
          {showTranslation && (
            <p className="course-translation">{lesson.translation}</p>
          )}
          <Quiz questions={[lesson.readingQuestion]} onPass={record} />
        </>
      )}
      {task === 'writing' && (
        <>
          <p>
            Эхлээд дарааллыг үз. Дараа нь «Өөрөө бичих» горимд зурлагыг дугаарын
            дагуу бичээрэй. Бүх үсгийг бичсэн үед дасгал хадгалагдана.
          </p>
          <div className="course-glyph-row">
            {characters.map((c, i) => (
              <button
                key={c}
                lang="ja"
                aria-pressed={index === i}
                onClick={() => setIndex(i)}
              >
                {c}
                {written.includes(c) ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <StrokeTutor
            char={character}
            onComplete={() => {
              const all = [...new Set([...written, character])];
              setWritten(all);
              if (characters.every((c) => all.includes(c)))
                store.add({
                  kind: 'task',
                  lessonId: lesson.id,
                  task: 'writing',
                  characters: all,
                });
            }}
          />
          {written.includes(character) && index < characters.length - 1 && (
            <button
              className="course-primary"
              onClick={() => setIndex(index + 1)}
            >
              Дараагийн үсэг →
            </button>
          )}
        </>
      )}
      {task === 'quiz' && (
        <>
          <div className="course-grammar">
            <h3>Өнөөдрийн дүрэм</h3>
            <p>{lesson.grammar}</p>
          </div>
          <Quiz questions={lessonQuestions(lesson)} onPass={record} />
        </>
      )}
      {task === 'listening' && (
        <>
          <p>
            Япон үгийг сонсоод утгыг сонгоно. Япон дуу хоолой байхгүй бол энэ
            нэмэлт дасгалыг алгасаж болно.
          </p>
          <Quiz
            questions={wordQuestions(lesson.words)
              .slice(0, 3)
              .map((q, i) => ({ ...q, prompt: lesson.words[i].kana }))}
            onPass={record}
            audio
          />
        </>
      )}
      {task === 'speaking' && (
        <Speaking
          word={lesson.words[0]}
          onResult={(transcript) =>
            store.add({
              kind: 'task',
              lessonId: lesson.id,
              task: 'speaking',
              transcript,
            })
          }
        />
      )}
      {audioError && (
        <p role="alert" className="course-banner">
          {audioError}
        </p>
      )}
    </>
  );
}
function ReviewPanel({ store, ids }: { store: CourseStore; ids: string[] }) {
  const [revealed, setRevealed] = useState(false);
  const today = localDay(new Date(), store.preferences.timezone);
  const latest = new Map<string, Extract<CourseEvent, { kind: 'review' }>>();
  for (const e of store.events)
    if (e.kind === 'review' && e.day === today) latest.set(e.wordId, e);
  const done = new Set(ids.filter((id) => (latest.get(id)?.rating ?? 0) > 0));
  const id =
    ids.find((id) => !latest.has(id)) ??
    ids.find((id) => {
      const e = latest.get(id);
      return e?.rating === 0 && Date.parse(e.at) + 600000 <= Date.now();
    });
  const word = id ? WORDS.get(id) : null;
  if (!word)
    return (
      <>
        <p>
          {ids.length
            ? done.size === ids.length
              ? 'Өнөөдрийн давталтаа хийлээ.'
              : 'Мартсан үгс 10 минутын дараа дахин гарна. Түр завсарлаад эргээд ороорой.'
            : 'Одоогоор давтах үг алга. Шинэ үгийн дасгалын дараа үгс давталтад орно.'}
        </p>
        <small>
          {reviewCards(store.events).length} үг давталтын санд байна.
        </small>
      </>
    );
  return (
    <div className="course-review">
      <p>
        {done.size} / {ids.length} давтсан
      </p>
      <h3 lang="ja">{word.jp}</h3>
      {revealed ? (
        <>
          <p>
            {word.kana} · {word.mn}
          </p>
          <div className="course-review-ratings">
            {(['Мартсан', 'Хэцүү', 'Санасан', 'Амархан'] as const).map(
              (label, rating) => (
                <button
                  key={rating}
                  onClick={() => {
                    store.add({
                      kind: 'review',
                      wordId: word.id,
                      rating: rating as 0 | 1 | 2 | 3,
                    });
                    setRevealed(false);
                  }}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </>
      ) : (
        <button onClick={() => setRevealed(true)}>
          Утгаа санаж хэлээд шалгах
        </button>
      )}
    </div>
  );
}
function Library() {
  const [query, setQuery] = useState(''),
    [selected, setSelected] = useState('日'),
    [kind, setKind] = useState<'kanji' | 'words' | 'kana' | 'dictionary'>(
      'kanji',
    );
  const matches = KANJI.filter((k) =>
    [k.char, k.mn, k.on, k.kun, k.example, k.reading].join(' ').includes(query),
  );
  const meta = KANJI.find((k) => k.char === selected);
  const [audioError, setAudioError] = useState('');
  return (
    <section className="course-card">
      <h2>Үсэг, үг, ханзны сан</h2>
      <p>
        102 суурь ханзны монгол тайлбар, төлөөлөх он/күн уншлага. Бичлэгийн сан
        6,798 япон тэмдэгттэй. Бүх ханзны тайлбар, бүх уншлагыг багтаасан толь
        биш.
      </p>
      <div className="course-segment">
        {(
          [
            ['kanji', 'Суурь ханз'],
            ['words', 'Үгс'],
            ['kana', 'Кана'],
            ['dictionary', 'Бүх ханзны толь'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setQuery('');
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {kind !== 'dictionary' && (
        <label className="course-search">
          Хайх
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              kind === 'kanji' ? '日, нар, にち…' : 'Үг, уншлага, утга…'
            }
          />
        </label>
      )}
      {kind === 'dictionary' ? (
        <KanjiDictionary />
      ) : kind === 'words' ? (
        <div className="course-vocab-grid">
          {[...WORDS.values()]
            .filter((w) =>
              [w.jp, w.kana, w.romaji, w.mn]
                .join(' ')
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((w) => (
              <article key={w.id}>
                <h3 lang="ja">{w.jp}</h3>
                <p>
                  {w.kana} · {w.romaji}
                </p>
                <strong>{w.mn}</strong>
                <button onClick={() => speakJapanese(w.kana, setAudioError)}>
                  ▶
                </button>
              </article>
            ))}
        </div>
      ) : (
        <div className="course-library-layout">
          <div>
            <div className="course-glyph-grid">
              {(kind === 'kana'
                ? Array.from(
                    new Set(
                      LESSONS.filter((l) => l.stage !== 'n5')
                        .flatMap((l) => l.glyphs)
                        .join(''),
                    ),
                  ).filter((c) => c.includes(query))
                : matches.map((k) => k.char)
              ).map((c) => (
                <button
                  lang="ja"
                  key={c}
                  aria-pressed={selected === c}
                  onClick={() => setSelected(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            {!matches.length && kind === 'kanji' && (
              <p>Тайлбартай ханз олдсонгүй.</p>
            )}
            <label className="course-search">
              Өөр япон тэмдэгтийн зурлага
              <input
                maxLength={2}
                placeholder="漢"
                onChange={(e) => {
                  const char = Array.from(e.target.value)[0];
                  if (
                    char &&
                    /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(
                      char,
                    )
                  )
                    setSelected(char);
                }}
              />
            </label>
          </div>
          <div className="course-library-detail">
            <h3 lang="ja">
              {selected} <span lang="mn">{meta?.mn}</span>
            </h3>
            {meta && (
              <>
                <dl>
                  <dt>Он уншлага</dt>
                  <dd lang="ja">{meta.on}</dd>
                  <dt>Күн уншлага</dt>
                  <dd lang="ja">{meta.kun}</dd>
                </dl>
                <p lang="ja">
                  {meta.example}（{meta.reading}）
                </p>
                <button
                  onClick={() => speakJapanese(meta.reading, setAudioError)}
                >
                  ▶ Үгийг сонсох
                </button>
              </>
            )}
            <StrokeTutor key={selected} char={selected} />
          </div>
        </div>
      )}
      {audioError && <p role="alert">{audioError}</p>}
    </section>
  );
}
function Milestones({ store }: { store: CourseStore }) {
  const cards = milestones(store.events, store.preferences);
  const learned = LESSONS.filter((l) => mastered(store.events, l.id)).length;
  const minutes = Math.floor(
    store.events.reduce((n, e) => n + (e.kind === 'study' ? e.seconds : 0), 0) /
      60,
  );
  return (
    <section className="course-card">
      <h2>Ахиц ба JLPT зорилго</h2>
      <div className="course-stat-grid">
        <div>
          <strong>
            {learned}/{LESSONS.length}
          </strong>
          <span>суурь хичээл</span>
        </div>
        <div>
          <strong>{reviewCards(store.events).length}</strong>
          <span>давталтад орсон үг</span>
        </div>
        <div>
          <strong>{minutes}</strong>
          <span>идэвхтэй минут</span>
        </div>
      </div>
      <p>
        JLPT-ийн албан ёсны оноог зөвхөн шалгалтын байгууллага гаргана. Эндхийн
        дасгалын хувь, хичээлийн явц нь JLPT оноо биш.
      </p>
      <h3>Төлөвлөлтийн баримжаа</h3>
      <p>
        Тэгээс эхлэх цагийн өргөн хүрээгээр тооцсон бүтээгдэхүүний таамаг. Албан
        ёсны шаардлагатай цаг биш. Идэвхтэй сурсан минутыг хасаж, хоёр долоо
        хоногоос хойш бодит хичээллэсэн давтамжаар шинэчилнэ. Баталгаатай тэнцэх
        өдөр, шалгалтын хуваарь гэж үзэхгүй.
      </p>
      <div className="course-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Түвшин</th>
              <th>Босго /180</th>
              <th>Цагийн баримжаа</th>
              <th>Төлөвлөх хүрээ</th>
              <th>Энэ репогийн агуулга</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((m) => (
              <tr key={m.level}>
                <th>{m.level}</th>
                <td>{JLPT[m.level as keyof typeof JLPT].pass}</td>
                <td>
                  {m.low}–{m.high} цаг
                </td>
                <td>
                  {dateLabel(m.earliest)} – {dateLabel(m.latest)}
                </td>
                <td>
                  {m.level === 'N5'
                    ? 'Суурь 24 нэгж; бүрэн N5 биш'
                    : 'Бүрэн курс нэмэгдээгүй'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        N5/N4: хэлний мэдлэг ба уншлага ≥38/120, сонсгол ≥19/60. N3–N1: гурван
        хэсэг тус бүр ≥19/60. Нийт босгыг давсан ч хэсэг дутвал тэнцэхгүй.
      </p>
      <a href={JLPT_SOURCE} target="_blank" rel="noreferrer">
        JLPT-ийн албан ёсны онооны тайлбар ↗
      </a>
      <p className="course-subtle">
        Жишээ нь өдөрт 20 минут нь жилд ойролцоогоор 122 цаг. N2-ыг хоёр жилд
        зоривол хөтөлбөрийн гадуурх уншлага, сонсгол, багштай дадлага болон
        өдөрт сурах хугацаагаа нэмэх шаардлагатай байж болно.
      </p>
    </section>
  );
}
function Settings({ store }: { store: CourseStore }) {
  const [p, setP] = useState<Preferences>(store.preferences);
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="course-settings"
      onSubmit={(e) => {
        e.preventDefault();
        void store.savePreferences(p).then(() => setSaved(true));
      }}
    >
      <label>
        Өдөрт сурах минут
        <select
          value={p.minutes}
          onChange={(e) => setP({ ...p, minutes: Number(e.target.value) })}
        >
          {[10, 20, 30, 45, 60].map((n) => (
            <option key={n} value={n}>
              {n} минут
            </option>
          ))}
        </select>
      </label>
      <label>
        Долоо хоногт сурах өдөр
        <select
          value={p.daysPerWeek}
          onChange={(e) => setP({ ...p, daysPerWeek: Number(e.target.value) })}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n} өдөр
            </option>
          ))}
        </select>
      </label>
      <label>
        Зорилтот түвшин
        <select
          value={p.target}
          onChange={(e) =>
            setP({ ...p, target: e.target.value as Preferences['target'] })
          }
        >
          {['N5', 'N4', 'N3', 'N2', 'N1'].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <label>
        Өдрийн зааг
        <select
          value={p.timezone}
          onChange={(e) => setP({ ...p, timezone: e.target.value })}
        >
          {[
            ...new Set([
              'Asia/Ulaanbaatar',
              'Asia/Tokyo',
              Intl.DateTimeFormat().resolvedOptions().timeZone,
              'UTC',
              p.timezone,
            ]),
          ].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <button className="course-primary" type="submit">
        Төлөвлөгөө хадгалах
      </button>
      <p role="status">{saved ? 'Төлөвлөгөө хадгалагдлаа.' : ''}</p>
    </form>
  );
}
