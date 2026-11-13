import React, { useEffect, useRef, useState } from "react";
import { getApiBase, request } from "@src/lib/api/client";
import type { Vocabulary } from "../../../packages/curriculum/src";
import { stopJapaneseAudio } from "./japaneseAudio";
type Assessment = {
  accuracy: number;
  fluency: number | null;
  completeness: number | null;
  overall: number | null;
  transcript: string;
  words: { word: string; accuracy: number | null; error: string }[];
};
export async function recordingWav(blob: Blob) {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration > 30.2) throw Error("Бичлэг 30 секундээс урт байна.");
    const offline = new OfflineAudioContext(
      1,
      Math.min(480000, Math.ceil(decoded.duration * 16000)),
      16000,
    );
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const audio = await offline.startRendering();
    const samples = audio.getChannelData(0);
    const bytes = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(bytes);
    const text = (at: number, value: string) =>
      Array.from(value).forEach((char, i) =>
        view.setUint8(at + i, char.charCodeAt(0)),
      );
    text(0, "RIFF");
    view.setUint32(4, bytes.byteLength - 8, true);
    text(8, "WAVE");
    text(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 32000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, "data");
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((value, i) => {
      const clamped = Math.max(-1, Math.min(1, value));
      view.setInt16(
        44 + i * 2,
        Math.round(clamped * (clamped < 0 ? 32768 : 32767)),
        true,
      );
    });
    return bytes;
  } finally {
    await context.close();
  }
}
export function AcousticPractice({
  word,
  disabled,
  onBusy,
}: {
  word: Vocabulary;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const [available, setAvailable] = useState(false),
    [recording, setRecording] = useState(false),
    [processing, setProcessing] = useState(false),
    [error, setError] = useState(""),
    [assessment, setAssessment] = useState<Assessment | null>(null),
    [playback, setPlayback] = useState("");
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    alive = useRef(true),
    url = useRef(""),
    controller = useRef<AbortController | null>(null);
  const ownAudio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (disabled || recording || processing) ownAudio.current?.pause();
  }, [disabled, recording, processing]);
  const busyRef = useRef(onBusy);
  busyRef.current = onBusy;
  useEffect(() => {
    alive.current = true;
    void request<{ data: { acousticAssessment: boolean } }>(
      "/api/auth/capabilities",
    )
      .then((r) => {
        if (alive.current) setAvailable(r.data.acousticAssessment);
      })
      .catch(() => undefined);
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      controller.current?.abort();
      if (url.current) URL.revokeObjectURL(url.current);
      busyRef.current(false);
    };
  }, []);
  if (!available)
    return (
      <p className="course-subtle">
        Авианы нарийвчилсан үнэлгээ одоогоор идэвхжээгүй. Дээрх дасгал нь зөвхөн
        танигдсан текстийг шалгана.
      </p>
    );
  const finish = () => {
    clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
  };
  return (
    <section className="course-grammar">
      <h3>Япон авианы үнэлгээ</h3>
      <p>
        Энэ сонголт бичлэгийг Microsoft Azure руу илгээнэ. Сервер бичлэг
        хадгалахгүй. 30 секунд хүртэл. Үнэлгээ нь JLPT оноо эсвэл pitch
        accent-ийн хэмжилт биш.
      </p>
      <button
        className="course-primary"
        disabled={
          disabled ||
          processing ||
          !navigator.mediaDevices?.getUserMedia ||
          typeof MediaRecorder === "undefined"
        }
        onClick={async () => {
          if (recording) {
            finish();
            return;
          }
          setError("");
          setAssessment(null);
          stopJapaneseAudio();
          busyRef.current(true);
          try {
            stream.current = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            if (!alive.current) {
              stream.current.getTracks().forEach((t) => t.stop());
              return;
            }
            let captureFailed = false;
            const chunks: BlobPart[] = [];
            const mime = [
              "audio/webm;codecs=opus",
              "audio/mp4",
              "audio/ogg;codecs=opus",
            ].find((value) => MediaRecorder.isTypeSupported(value));
            const capture = new MediaRecorder(
              stream.current,
              mime ? { mimeType: mime } : undefined,
            );
            recorder.current = capture;
            capture.ondataavailable = (e) => {
              if (e.data.size) chunks.push(e.data);
            };
            capture.onerror = () => {
              captureFailed = true;
              finish();
              if (alive.current)
                setError("Бичлэг тасарлаа. Дахин оролдоно уу.");
            };
            capture.onstop = async () => {
              stream.current?.getTracks().forEach((t) => t.stop());
              if (!alive.current) return;
              setRecording(false);
              if (captureFailed) {
                busyRef.current(false);
                return;
              }
              setProcessing(true);
              try {
                const blob = new Blob(chunks, { type: capture.mimeType });
                if (url.current) URL.revokeObjectURL(url.current);
                url.current = URL.createObjectURL(blob);
                setPlayback(url.current);
                const wav = await recordingWav(blob);
                controller.current = new AbortController();
                const timeout = setTimeout(
                  () => controller.current?.abort(),
                  25000,
                );
                try {
                  const response = await fetch(
                    getApiBase() +
                      "/api/speech/assess?" +
                      new URLSearchParams({ wordId: word.id }),
                    {
                      method: "POST",
                      headers: { "Content-Type": "audio/wav" },
                      body: wav,
                      signal: controller.current.signal,
                    },
                  );
                  const r = await response.json();
                  if (!response.ok)
                    throw Error(r.error ?? "Үнэлгээ амжилтгүй.");
                  if (alive.current) setAssessment(r.data);
                } finally {
                  clearTimeout(timeout);
                }
              } catch (err) {
                if (alive.current)
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Бичлэгийг үнэлж чадсангүй.",
                  );
              } finally {
                if (alive.current) setProcessing(false);
                busyRef.current(false);
              }
            };
            capture.start();
            setRecording(true);
            timer.current = setTimeout(finish, 29500);
          } catch {
            stream.current?.getTracks().forEach((t) => t.stop());
            setError(
              "Микрофоны зөвшөөрөл олгогдоогүй эсвэл бичлэг эхэлсэнгүй.",
            );
            busyRef.current(false);
          }
        }}
      >
        {recording
          ? "■ Бичлэг зогсоож үнэлэх"
          : processing
            ? "Япон бичлэгийг үнэлж байна…"
            : "● Бичиж авиаг үнэлүүлэх"}
      </button>
      {playback && !recording && (
        <div>
          <p>Өөрийн бичлэгээ харьцуулж сонсох</p>
          <audio
            ref={ownAudio}
            src={playback}
            controls={!disabled && !processing}
            preload="metadata"
          />
        </div>
      )}
      {error && <p role="alert">{error} Оноо бүртгээгүй.</p>}
      {assessment && (
        <div role="status">
          <p>
            Танигдсан: <span lang="ja">{assessment.transcript}</span>
          </p>
          <dl>
            {(
              [
                ["Авиа", assessment.accuracy],
                ["Жигд байдал", assessment.fluency],
                ["Бүрэн хэлсэн байдал", assessment.completeness],
              ] as const
            ).map(([name, value]) => (
              <React.Fragment key={name}>
                <dt>{name}</dt>
                <dd>{value === null ? "—" : `${Math.round(value)}/100`}</dd>
              </React.Fragment>
            ))}
          </dl>
          {assessment.words.map((item, i) => (
            <p key={i} lang="ja">
              {item.word} ·{" "}
              {item.accuracy === null ? "—" : Math.round(item.accuracy)} ·{" "}
              {item.error}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
