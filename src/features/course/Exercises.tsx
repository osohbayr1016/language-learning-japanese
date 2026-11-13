import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildKanjiWriterHtml } from "@src/components/writing/kanjiWriterHtml";
import {
  useSpeechSession,
  ensureSpeechPermission,
} from "@src/lib/audio/speech";
import { scoreBestJapaneseUtterance } from "@src/lib/audio/speechScoring";
import type { Draft } from "./persistence";
import type { Question, Vocabulary } from "../../../packages/curriculum/src";
export { speakJapanese } from "./japaneseAudio";
import { speakJapanese, stopJapaneseAudio } from "./japaneseAudio";
import { AcousticPractice } from "./AcousticPractice";
export function Quiz({
  questions,
  onPass,
  label = "Шалгах",
  audio = false,
  minAccuracy = 0.8,
  draft,
  saveDraft,
  onAttempt,
}: {
  questions: Question[];
  onPass: (answers: number[]) => void;
  label?: string;
  audio?: boolean;
  minAccuracy?: number;
  draft?: Draft;
  saveDraft?: (draft: Draft) => void;
  onAttempt?: (answers: number[]) => void;
}) {
  const [audioReady, setAudioReady] = useState(false);
  const initial =
    draft &&
    Array.isArray(draft.answers) &&
    Number.isInteger(draft.index) &&
    Number(draft.index) >= 0 &&
    Number(draft.index) < questions.length &&
    draft.answers.length ===
      (draft.finished ? questions.length : Number(draft.index)) &&
    draft.answers.every(
      (a, i) =>
        Number.isInteger(a) &&
        Number(a) >= 0 &&
        Number(a) < questions[i].options.length,
    )
      ? draft
      : undefined;
  const [index, setIndex] = useState(Number(initial?.index ?? 0)),
    [answers, setAnswers] = useState<number[]>(
      (initial?.answers as number[]) ?? [],
    ),
    [selected, setSelected] = useState<number | null>(
      Number.isInteger(initial?.selected) &&
        Number(initial?.selected) >= 0 &&
        Number(initial?.selected) <
          questions[Number(initial?.index ?? 0)].options.length
        ? Number(initial?.selected)
        : null,
    ),
    [checked, setChecked] = useState(initial?.checked === true),
    [finished, setFinished] = useState(initial?.finished === true),
    [audioError, setAudioError] = useState("");
  const draftRef = useRef(saveDraft);
  draftRef.current = saveDraft;
  useEffect(() => {
    draftRef.current?.({ index, answers, selected, checked, finished });
  }, [index, answers, selected, checked, finished]);
  const q = questions[index];
  const score = answers.filter((a, i) => a === questions[i].answer).length;
  if (finished)
    return (
      <div className="course-feedback" role="status">
        <h3>
          {score} / {questions.length} зөв
        </h3>
        <p>
          {score / questions.length >= minAccuracy
            ? "Дасгал хадгалагдлаа."
            : `${Math.round(minAccuracy * 100)}%-д хүрэхийн тулд тайлбараа уншаад дахин оролдоорой.`}
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setAnswers([]);
            setSelected(null);
            setChecked(false);
            setFinished(false);
            setAudioReady(false);
            setAudioError("");
          }}
        >
          Дахин хийх
        </button>
      </div>
    );
  return (
    <div className="course-quiz">
      <p className="course-kicker">
        АСУУЛТ {index + 1} / {questions.length}
      </p>
      {audio ? (
        <>
          <button
            onClick={() => {
              setAudioError("");
              setAudioReady(false);
              speakJapanese(
                q.prompt,
                (message) => {
                  setAudioError(message);
                  setAudioReady(false);
                },
                () => setAudioReady(true),
              );
            }}
          >
            ▶ Сонсоод утгыг сонгох
          </button>
          {audioError && (
            <p role="alert">{audioError} Сонсох дасгалын дүн бүртгэгдэхгүй.</p>
          )}
        </>
      ) : (
        <h3
          lang={
            /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}（）　。]+$/u.test(
              q.prompt,
            )
              ? "ja"
              : undefined
          }
        >
          {q.prompt}
        </h3>
      )}
      <fieldset disabled={checked || (audio && (!audioReady || !!audioError))}>
        <legend className="course-sr">Хариултаа сонгох</legend>
        {q.options.map((o, i) => (
          <label
            key={i}
            className={`course-answer ${checked && i === q.answer ? "is-correct" : ""}`}
          >
            <input
              type="radio"
              name="answer"
              checked={selected === i}
              onChange={() => setSelected(i)}
            />
            <span>{o}</span>
          </label>
        ))}
      </fieldset>
      {checked && (
        <p className="course-feedback" role="status">
          {selected === q.answer ? "Зөв. " : "Дахин тогтоогоорой. "}
          {q.explanation}
        </p>
      )}
      <button
        className="course-primary"
        disabled={selected === null || (audio && (!audioReady || !!audioError))}
        onClick={() => {
          if (!checked) {
            setChecked(true);
            return;
          }
          const next = [...answers, selected!];
          setAnswers(next);
          if (index === questions.length - 1) {
            setFinished(true);
            if (
              next.filter((a, i) => a === questions[i].answer).length /
                questions.length >=
              minAccuracy
            )
              onPass(next);
            else onAttempt?.(next);
          } else {
            setIndex(index + 1);
            setSelected(null);
            setChecked(false);
            setAudioError("");
            setAudioReady(false);
          }
        }}
      >
        {checked
          ? index === questions.length - 1
            ? "Дүн харах"
            : "Дараагийн асуулт"
          : label}
      </button>
    </div>
  );
}
export function StrokeTutor({
  char,
  onComplete,
  resumeAt = 0,
  onProgress,
  initialMode,
  onModeChange,
}: {
  char: string;
  onComplete?: () => void;
  resumeAt?: number;
  onProgress?: (index: number) => void;
  initialMode?: "animate" | "quiz" | "show";
  onModeChange?: (mode: "animate" | "quiz" | "show") => void;
}) {
  const [mode, setMode] = useState<"animate" | "quiz" | "show">(
    initialMode ?? (resumeAt ? "quiz" : "animate"),
  );
  const [run, setRun] = useState(0);
  const [message, setMessage] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  useEffect(() => {
    setMessage("");
    const handler = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      try {
        const raw = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (raw?.__kanji !== 1) return;
        const m = raw.payload;
        if (m.type === "strokeComplete" && m.isCorrect)
          progressRef.current?.(m.strokeNum + 1);
        if (m.type === "complete") {
          setMessage("Зөв дарааллаар бичлээ");
          completeRef.current?.();
        }
        if (m.type === "error") setMessage(m.message);
        if (m.type === "mistake") setMessage("Дараалал, чиглэлээ шалгаарай");
      } catch {
        /*Ignore unrelated bridge messages*/
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [char, mode]);
  const html = useMemo(
    () =>
      buildKanjiWriterHtml(
        char,
        mode,
        "#fffdf8",
        "#263b34",
        "#e2dfd5",
        280,
        "parent",
        true,
        resumeAt,
      ),
    [char, mode, run],
  );
  return (
    <div className="course-tutor">
      <div className="course-segment" role="group" aria-label="Бичих горим">
        {(
          [
            ["animate", "Дараалал"],
            ["show", "Загвар"],
            ["quiz", "Өөрөө бичих"],
          ] as const
        ).map(([m, label]) => (
          <button
            aria-pressed={mode === m}
            key={m}
            onClick={() => {
              setMessage("");
              setMode(m);
              onModeChange?.(m);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <iframe
        key={`${char}-${mode}-${run}`}
        ref={frame}
        title={`${char} япон зурлагын дараалал`}
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin"
      />
      <p role="status">
        {message || "Дугаараар эхэлж, зурлагын чиглэлийг дагаарай."}
      </p>
      <button
        onClick={() => {
          progressRef.current?.(0);
          setRun(run + 1);
          setMessage("");
        }}
      >
        Дахин эхлэх
      </button>
      <small>
        <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noreferrer">
          KanjiVG
        </a>{" "}
        · Ulrich Apel · CC BY-SA 3.0
      </small>
    </div>
  );
}
export function Speaking({
  word,
  onResult,
}: {
  word: Vocabulary;
  onResult: (text: string) => void;
}) {
  const session = useSpeechSession();
  const [acousticBusy, setAcousticBusy] = useState(false);
  const [message, setMessage] = useState("");
  const score = session.result
    ? scoreBestJapaneseUtterance(
        [session.result.transcript, ...(session.result.alternatives ?? [])],
        { jp: word.jp, kana: word.kana, romaji: word.romaji },
      )
    : null;
  return (
    <section>
      <h3 lang="ja">
        {word.jp} <small>{word.kana}</small>
      </h3>
      <p>
        Япон яриа танилтаар хэлсэн үг таарч байгаа эсэхийг шалгана. Pitch
        accent, авиа бүрийн чанарыг хэмжихгүй.
      </p>
      <p className="course-subtle">
        Хөтөч таны дууг яриа таних үйлчилгээ рүү илгээж болно. Энэ апп дууны
        бичлэг хадгалахгүй.
      </p>
      <div className="course-actions">
        <button
          disabled={
            acousticBusy ||
            session.state === "listening" ||
            session.state === "requesting"
          }
          onClick={() => speakJapanese(word.kana, setMessage)}
        >
          ▶ Жишээ сонсох
        </button>
        {session.supported ? (
          <button
            className="course-primary"
            disabled={acousticBusy || session.state === "requesting"}
            onClick={async () => {
              if (session.state === "listening") {
                session.stop();
                return;
              }
              setMessage("");
              stopJapaneseAudio();
              session.reset();
              if (await ensureSpeechPermission()) session.start();
              else
                setMessage(
                  "Микрофоны зөвшөөрөл олгогдоогүй. Сонсох дасгалаа үргэлжлүүлж болно.",
                );
            }}
          >
            {session.state === "listening"
              ? "■ Зогсоож шалгах"
              : "● Япон үгээ хэлэх"}
          </button>
        ) : (
          <p>
            Энэ хөтөч яриа таних боломжгүй. Chrome эсвэл Edge дээр туршина уу.
          </p>
        )}
      </div>
      <p role="status">
        {session.liveTranscript || session.errorMessage || message}
      </p>
      <AcousticPractice
        word={word}
        disabled={
          session.state === "listening" || session.state === "requesting"
        }
        onBusy={setAcousticBusy}
      />
      {score && (
        <div className="course-feedback">
          <p>
            Танигдсан: <span lang="ja">{session.result!.transcript}</span>
          </p>
          <p>
            Текстийн тохирол: {score.finalPercent}% ·{" "}
            {score.pass ? "Үг таарлаа" : "Жишээг сонсоод дахин хэлээрэй"}
          </p>
          <p>Энэ хувь нь дуудлагын чанарын үнэлгээ биш.</p>
          {score.pass && (
            <button
              onClick={() => {
                onResult(session.result!.transcript);
                session.reset();
                setMessage("Дадлага хадгалагдлаа");
              }}
            >
              Дадлагаа хадгалах
            </button>
          )}
        </div>
      )}
    </section>
  );
}
