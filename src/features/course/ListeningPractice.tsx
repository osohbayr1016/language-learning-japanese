import React, { useEffect, useState } from "react";
import {
  DIALOGUE_BY_ID,
  LISTENING_DIALOGUES,
} from "../../../packages/curriculum/src";
import type { CourseStore } from "./useCourse";
import { Quiz } from "./Exercises";
import { stopJapaneseAudio } from "./japaneseAudio";
export function ListeningPractice({ store }: { store: CourseStore }) {
  const [stage, setStage] = useState("beginner");
  const clips = LISTENING_DIALOGUES.filter((clip) => clip.stage === stage);
  const [clipId, setClipId] = useState(LISTENING_DIALOGUES[0].id);
  const clip = DIALOGUE_BY_ID.get(clipId)!;
  useEffect(() => () => stopJapaneseAudio(), [clipId]);
  const [support, setSupport] = useState(false);
  const latest = store.events
    .filter((event) => event.kind === "dialogue" && event.clipId === clipId)
    .at(-1);
  const select = (id: string) => {
    setClipId(id);
    setSupport(false);
  };
  return (
    <section className="course-card">
      <h2>Богино яриаг ойлгох</h2>
      <p>
        Эхлээд бичвэрийг харалгүй сонс. Асуултад хариулаад тайлбараар өөрийгөө
        шалга. Синтез дуу ашиглана; энэ нь JLPT-ийн албан ёсны сорил биш.
      </p>
      <label className="course-search">
        Сонсголын түвшин
        <select
          value={stage}
          onChange={(e) => {
            setStage(e.target.value);
            select(
              LISTENING_DIALOGUES.find((clip) => clip.stage === e.target.value)!
                .id,
            );
          }}
        >
          <option value="beginner">Анхан шат</option>
          <option value="n5">N5 суурь</option>
          <option value="n4">N4 суурь</option>
        </select>
      </label>
      <label className="course-search">
        Харилцан яриа
        <select value={clipId} onChange={(e) => select(e.target.value)}>
          {clips.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      {latest?.kind === "dialogue" && (
        <p className="course-subtle">
          Сүүлийн оролдлого:{" "}
          {latest.answer === clip.question.answer ? "зөв" : "дахин давтах"} ·{" "}
          {latest.day}
        </p>
      )}
      <h3>{clip.question.prompt}</h3>
      <Quiz
        key={clipId}
        questions={[{ ...clip.question, prompt: clip.kana }]}
        audio
        minAccuracy={0}
        onPass={(answers) =>
          store.add({ kind: "dialogue", clipId, answer: answers[0] })
        }
      />
      <button aria-expanded={support} onClick={() => setSupport((v) => !v)}>
        Ярианы бичвэр, утга {support ? "нуух" : "харах"}
      </button>
      {support && (
        <div className="course-grammar">
          <p lang="ja">{clip.transcript}</p>
          <p lang="ja">{clip.kana}</p>
          <p>{clip.translation}</p>
          <p>{clip.question.explanation}</p>
        </div>
      )}
    </section>
  );
}
