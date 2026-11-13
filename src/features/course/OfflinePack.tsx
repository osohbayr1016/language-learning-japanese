import React, { useEffect, useState } from "react";
type Manifest = { version: string; bytes: number; files: string[] };
export function OfflinePack() {
  const [manifest, setManifest] = useState<Manifest | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [complete, setComplete] = useState(false);
  useEffect(() => {
    let alive = true;
    void fetch("/offline-manifest.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(async (data: Manifest) => {
        if (!alive) return;
        setManifest(data);
        const cache = await caches.open("nihongo-static-v1");
        const results = await Promise.all(
          data.files.map((file) => cache.match(file)),
        );
        if (alive) setComplete(results.every(Boolean));
      })
      .catch(() => {
        if (alive)
          setMessage("Татах багцыг ачаалахын тулд интернэтэд холбоно уу.");
      });
    return () => {
      alive = false;
    };
  }, []);
  if (!("caches" in window) || !("serviceWorker" in navigator))
    return (
      <p>
        Энэ хөтөч интернэтгүй багц дэмжихгүй байна. Явцаа экспортлож хадгалж
        болно.
      </p>
    );
  return (
    <details className="course-offline">
      <summary>Интернэтгүй суралцах багц</summary>
      <p>
        Хичээл, үг, толь, суурь ханзны зурлагыг энэ төхөөрөмжид татна. Серверийн
        audio, яриа танилт, акустик үнэлгээнд холболт хэрэгтэй.
      </p>
      {manifest && (
        <p>
          {Math.ceil(manifest.bytes / 1024 / 1024)} MB орчим ·{" "}
          {complete
            ? "Багц энэ төхөөрөмжид бэлэн"
            : "Багцыг урьдчилан татаж бэлдээрэй"}
        </p>
      )}
      <div className="course-actions">
        <button
          disabled={busy || !manifest}
          onClick={async () => {
            if (!manifest) return;
            setBusy(true);
            setComplete(false);
            try {
              await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(Error("Offline worker unavailable")),
                    15000,
                  ),
                ),
              ]);
              const cache = await caches.open("nihongo-static-v1");
              let count = 0;
              for (let at = 0; at < manifest.files.length; at += 4) {
                await Promise.all(
                  manifest.files.slice(at, at + 4).map(async (file) => {
                    const response = await fetch(file, { cache: "reload" });
                    if (!response.ok) throw Error("Файлыг татаж чадсангүй.");
                    await cache.put(file, response);
                    count++;
                  }),
                );
                setMessage(`${count}/${manifest.files.length} файл бэлэн`);
              }
              setComplete(true);
              setMessage(
                "Багц бэлэн. Холболтгүй үед ч хичээл, зурлага, ахицаа ашиглаж болно.",
              );
            } catch {
              setMessage(
                "Таталт тасарлаа эсвэл төхөөрөмжийн зай хүрсэнгүй. Холболт, зайгаа шалгаад дахин оролдоно уу. Хадгалсан ахиц хэвээр.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy
            ? "Татаж байна…"
            : complete
              ? "Багцыг шинэчлэх"
              : "Багцыг татах"}
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            await caches.delete("nihongo-static-v1");
            setComplete(false);
            setMessage(
              "Татсан файлуудыг цэвэрлэлээ. Хичээлийн ахицыг устгаагүй.",
            );
          }}
        >
          Татсан файлууд цэвэрлэх
        </button>
      </div>
      <p role="status">{message}</p>
    </details>
  );
}
