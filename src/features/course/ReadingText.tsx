import React, { useMemo, useState } from "react";
import type { Lesson, Vocabulary } from "../../../packages/curriculum/src";
import type { CourseStore } from "./useCourse";
import { speakJapanese } from "./japaneseAudio";
export function ReadingText({
  lesson,
  store,
}: {
  lesson: Lesson;
  store: CourseStore;
}) {
  const [furigana, setFurigana] = useState(false),
    [selected, setSelected] = useState<Vocabulary | null>(null),
    [message, setMessage] = useState("");
  const segments = useMemo(() => {
    const words = lesson.words
      .filter((w) => /\p{Script=Han}/u.test(w.jp))
      .sort((a, b) => b.jp.length - a.jp.length);
    const result: { text: string; word?: Vocabulary }[] = [];
    let at = 0;
    while (at < lesson.passage.length) {
      const matches = words
        .map((word) => {
          let index = lesson.passage.indexOf(word.jp, at);
          while (
            index >= 0 &&
            (/\p{Script=Han}/u.test(lesson.passage[index - 1] ?? "") ||
              /\p{Script=Han}/u.test(
                lesson.passage[index + word.jp.length] ?? "",
              ))
          )
            index = lesson.passage.indexOf(word.jp, index + 1);
          return { word, index };
        })
        .filter((x) => x.index >= 0)
        .sort(
          (a, b) => a.index - b.index || b.word.jp.length - a.word.jp.length,
        );
      const match = matches[0];
      if (!match) {
        result.push({ text: lesson.passage.slice(at) });
        break;
      }
      if (match.index > at)
        result.push({ text: lesson.passage.slice(at, match.index) });
      result.push({ text: match.word.jp, word: match.word });
      at = match.index + match.word.jp.length;
    }
    return result;
  }, [lesson]);
  return (
    <>
      <button aria-pressed={furigana} onClick={() => setFurigana((v) => !v)}>
        ふりがな {furigana ? "нуух" : "харах"}
      </button>
      <div className="course-passage" lang="ja">
        {segments.map((segment, i) =>
          segment.word ? (
            <button
              className="course-inline-word"
              key={i}
              onClick={() => {
                setSelected(segment.word!);
                setMessage("");
              }}
            >
              {furigana ? (
                <ruby>
                  {segment.text}
                  <rt>{segment.word.kana}</rt>
                </ruby>
              ) : (
                segment.text
              )}
            </button>
          ) : (
            <React.Fragment key={i}>{segment.text}</React.Fragment>
          ),
        )}
      </div>
      {selected && (
        <aside
          className="course-word-popover"
          aria-label="Сонгосон үгийн тайлбар"
        >
          <button
            className="course-popover-close"
            onClick={() => setSelected(null)}
          >
            Хаах
          </button>
          <strong lang="ja">
            {selected.jp}（{selected.kana}）
          </strong>
          <p>{selected.mn}</p>
          <div className="course-actions">
            <button onClick={() => speakJapanese(selected.kana, setMessage)}>
              ▶ Үгийг сонсох
            </button>
            <button
              onClick={() => {
                store.add({ kind: "expose", wordId: selected.id });
                setMessage("Үгийг давталтад нэмлээ.");
              }}
            >
              Давталтад нэмэх
            </button>
          </div>
          <p role="status">{message}</p>
        </aside>
      )}
    </>
  );
}
