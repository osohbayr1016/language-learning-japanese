import React, { useEffect, useMemo, useState } from "react";
import { KANJI } from "../../../packages/curriculum/src";
import { StrokeTutor } from "./Exercises";
type Entry = {
  char: string;
  meanings: string[];
  on: string[];
  kun: string[];
  strokes: number;
  grade: number | null;
  joyo: boolean;
};
export function KanjiDictionary() {
  const [data, setData] = useState<Entry[]>([]),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [query, setQuery] = useState(""),
    [joyo, setJoyo] = useState(true),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState("日");
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void fetch("/dictionary/kanji.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows)) throw Error();
        setData(rows);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("Ханзны толийг ачаалж чадсангүй.");
      });
    return () => controller.abort();
  }, [retry]);
  const overlay = useMemo(() => new Map(KANJI.map((k) => [k.char, k])), []);
  const results = useMemo(
    () =>
      data.filter(
        (k) =>
          (!joyo || k.joyo) &&
          [
            k.char,
            ...k.meanings,
            ...k.on,
            ...k.kun,
            overlay.get(k.char)?.mn ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [data, joyo, query, overlay],
  );
  const entry = data.find((k) => k.char === selected),
    mn = overlay.get(selected);
  return (
    <div>
      <h3>Япон ханзны дэлгэрэнгүй толь</h3>
      <p>
        13,108 тэмдэгтийн япон уншлага, англи утга. Jōyō 2,136 ханзаас эхэлж
        болно. {KANJI.length} суурь ханз монгол тайлбартай. Дурын ханзыг
        JLPT-ийн албан жагсаалтад хамааруулж тооцохгүй.
      </p>
      <label className="course-search">
        Хайх
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="漢, かん, water, ус…"
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={joyo}
          onChange={(e) => {
            setJoyo(e.target.checked);
            setPage(0);
          }}
        />{" "}
        Зөвхөн Jōyō 2,136 ханз
      </label>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => setRetry(retry + 1)}>Дахин ачаалах</button>
        </div>
      ) : !data.length ? (
        <p role="status">Толийг ачаалж байна…</p>
      ) : (
        <>
          <p>
            {results.length} илэрц · {page + 1} /{" "}
            {Math.max(1, Math.ceil(results.length / 100))} хуудас
          </p>
          <div className="course-library-layout">
            <div>
              <div className="course-glyph-grid">
                {results.slice(page * 100, (page + 1) * 100).map((k) => (
                  <button
                    lang="ja"
                    key={k.char}
                    aria-pressed={selected === k.char}
                    onClick={() => setSelected(k.char)}
                  >
                    {k.char}
                  </button>
                ))}
              </div>
              <div className="course-actions">
                <button disabled={!page} onClick={() => setPage(page - 1)}>
                  ← Өмнөх
                </button>
                <button
                  disabled={(page + 1) * 100 >= results.length}
                  onClick={() => setPage(page + 1)}
                >
                  Дараах →
                </button>
              </div>
            </div>
            {entry && (
              <div className="course-library-detail">
                <h3 lang="ja">
                  {entry.char} <span lang="mn">{mn?.mn}</span>
                </h3>
                <p lang="en">{entry.meanings.join(", ")}</p>
                <dl>
                  <dt>Он</dt>
                  <dd lang="ja">{entry.on.join("・") || "—"}</dd>
                  <dt>Күн</dt>
                  <dd lang="ja">{entry.kun.join("・") || "—"}</dd>
                  <dt>Зурлага</dt>
                  <dd>{entry.strokes}</dd>
                </dl>
                <p className="course-subtle">
                  Уншлагын цэг нь ханз ба залгаврын заагийг заана. Уншлагыг
                  үгийн дотор тогтооно.
                </p>
                <StrokeTutor key={selected} char={selected} />
              </div>
            )}
          </div>
        </>
      )}
      <p className="course-subtle">
        KANJIDIC © James William Breen / EDRDG ·{" "}
        <a
          href="https://www.edrdg.org/edrdg/licence.html"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-SA 4.0
        </a>{" "}
        ·{" "}
        <a
          href="https://github.com/davidluzgouveia/kanji-data"
          target="_blank"
          rel="noreferrer"
        >
          JSON: David Luz Gouveia
        </a>{" "}
        ·{" "}
        <a href="/dictionary/source.json" target="_blank" rel="noreferrer">
          Өгөгдлийн хувилбар
        </a>
      </p>
    </div>
  );
}
