import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  courseSummary,
  HIRAGANA_PLACEMENT,
  LESSON_BY_ID,
  missedQuestions,
  type Question,
} from "../../../packages/curriculum/src";
import type { CourseStore } from "./useCourse";
import { ListeningPractice } from "./ListeningPractice";
import { Quiz } from "./Exercises";
export function Practice({ store }: { store: CourseStore }) {
  const mistakes = useMemo(() => missedQuestions(store.events), [store.events]);
  const [selected, setSelected] = useState(0);
  const item = mistakes[Math.min(selected, Math.max(0, mistakes.length - 1))];
  return (
    <>
      <section className="course-card">
        <h2>Алдаагаа нэг нэгээр нь засъя</h2>
        <p>
          Алдсан асуултаа зөв хийвэл энэ жагсаалтаас гарна. Үндсэн хичээлийг
          давсан гэж тооцохгүй.
        </p>
        {item ? (
          <>
            <p>
              {mistakes.length} асуулт давтах ·{" "}
              {LESSON_BY_ID.get(item.lessonId)?.title}
            </p>
            <Quiz
              key={item.lessonId + item.task + item.index}
              questions={[item.question]}
              audio={item.task === "listening"}
              minAccuracy={0}
              onPass={(answers) =>
                store.add({
                  kind: "remedy",
                  lessonId: item.lessonId,
                  task: item.task,
                  question: item.index,
                  answer: answers[0],
                })
              }
            />
            {mistakes.length > 1 && (
              <button
                onClick={() => setSelected((i) => (i + 1) % mistakes.length)}
              >
                Өөр асуулт давтах
              </button>
            )}
          </>
        ) : (
          <p className="course-success">
            Одоогоор үлдсэн алдаа алга. Дасгалд алдсан асуултууд энд
            хадгалагдана.
          </p>
        )}
      </section>
      <KanaFluency store={store} />
      <ListeningPractice store={store} />
      <section className="course-card">
        <h2>Нэмэлт дадлага</h2>
        <div className="course-actions">
          <Link to="/study/mock-exam">Бататгах сорил</Link>
          <Link to="/games">Тоглоом</Link>
        </div>
      </section>
    </>
  );
}
function makeQuestions(script: "hiragana" | "katakana") {
  const pool = [...HIRAGANA_PLACEMENT];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const questions = pool.slice(0, 20);
  return questions.map((q) => ({
    ...q,
    prompt:
      script === "katakana"
        ? String.fromCodePoint(q.prompt.codePointAt(0)! + 96)
        : q.prompt,
  }));
}
function KanaFluency({ store }: { store: CourseStore }) {
  const [script, setScript] = useState<"hiragana" | "katakana">("hiragana");
  const [trial, setTrial] = useState<{
    questions: Question[];
    at: number;
    id: number;
  } | null>(null);
  const [result, setResult] = useState("");
  const attempts = store.events
    .filter((e) => e.kind === "fluency" && e.script === script)
    .slice(-5)
    .reverse();
  return (
    <section className="course-card">
      <h2>Канаа түгдрэлгүй таних</h2>
      <p>
        20 үсгийн уншлагыг сонгоно. Хугацаа, зөв таньсан тоогоо харьцуул. Энэ нь
        чангаар унших эсвэл дуудлагын үнэлгээ биш.
      </p>
      <div className="course-actions">
        <button
          aria-pressed={script === "hiragana"}
          onClick={() => {
            setScript("hiragana");
            setTrial(null);
            setResult("");
          }}
        >
          Хирагана
        </button>
        <button
          aria-pressed={script === "katakana"}
          onClick={() => {
            setScript("katakana");
            setTrial(null);
            setResult("");
          }}
        >
          Катакана
        </button>
        <button
          className="course-primary"
          onClick={() => {
            setResult("");
            setTrial({
              questions: makeQuestions(script),
              at: Date.now(),
              id: Date.now(),
            });
          }}
        >
          20 үсэг таних
        </button>
      </div>
      {trial && (
        <Quiz
          key={trial.id}
          questions={trial.questions}
          minAccuracy={0}
          onPass={(answers) => {
            const correct = answers.filter(
              (a, i) => a === trial.questions[i].answer,
            ).length;
            const seconds = Math.max(
              1,
              Math.min(3600, Math.round((Date.now() - trial.at) / 1000)),
            );
            store.add({
              kind: "fluency",
              script,
              correct,
              total: trial.questions.length,
              seconds,
            });
            setResult(`${correct}/20 зөв · ${seconds} секунд`);
          }}
        />
      )}
      {result && <p role="status">{result}</p>}
      {!!attempts.length && (
        <details>
          <summary>Сүүлийн таних дасгалууд</summary>
          <ul>
            {attempts.map(
              (e) =>
                e.kind === "fluency" && (
                  <li key={e.id}>
                    {e.day} · {e.correct}/{e.total} зөв · {e.seconds} сек
                  </li>
                ),
            )}
          </ul>
        </details>
      )}
    </section>
  );
}
export function WeeklyReport({ store }: { store: CourseStore }) {
  const now = Date.now(),
    cutoff = new Date(now - 7 * 86400000).toISOString();
  const recent = store.events.filter((e) => e.at >= cutoff);
  const summary = courseSummary(recent, store.preferences);
  const all = courseSummary(store.events, store.preferences);
  return (
    <section className="course-card">
      <h2>Сүүлийн 7 хоног</h2>
      <div className="course-stat-grid">
        <div>
          <strong>{summary.minutes}</strong>
          <span>идэвхтэй минут</span>
        </div>
        <div>
          <strong>{summary.days}</strong>
          <span>сурсан өдөр</span>
        </div>
        <div>
          <strong>{summary.reviews}</strong>
          <span>давталт</span>
        </div>
      </div>
      <p>
        {all.currentStreak} өдөр дараалан суралцсан · Хамгийн урт нь{" "}
        {all.longestStreak} өдөр
      </p>
      <p>
        {all.errors
          ? `${all.errors} асуултыг алдааны дэвтрээсээ давтаарай.`
          : "Дараагийн долоо хоногт богино уншлага, давталтаа тогтмол үргэлжлүүлээрэй."}
      </p>
      <Link to="/course?tab=practice">Алдаа, канагаа давтах →</Link>
    </section>
  );
}
