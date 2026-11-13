import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const lessons = ["lessons", "extension-lessons"].flatMap((name) =>
  JSON.parse(readFileSync(`packages/curriculum/src/${name}.json`, "utf8")),
);
const kanji = ["kanji", "extension-kanji"].flatMap((name) =>
  JSON.parse(readFileSync(`packages/curriculum/src/${name}.json`, "utf8")),
);
const buckets = new Set(
  [
    ...lessons.flatMap((l) => Array.from(l.glyphs.join(""))),
    ...kanji.map((k) => k.char),
  ]
    .filter((c) => c !== "ー")
    .map((c) => Math.floor(c.codePointAt(0) / 128).toString(16)),
);
const files = [
  "/index.html",
  "/icons.json",
  ...readdirSync("dist/assets")
    .filter((f) => /\.(js|css)$/.test(f))
    .map((f) => "/assets/" + f),
  ...readdirSync("dist/fonts")
    .filter((f) => /\.woff$/.test(f))
    .map((f) => "/fonts/" + f),
  "/dictionary/kanji.json",
  "/dictionary/source.json",
  ...Array.from(buckets, (b) => "/stroke-data/" + b + ".json"),
];
const hash = createHash("sha256");
let bytes = 0;
for (const file of files) {
  const data = readFileSync("dist" + file);
  bytes += data.length;
  hash.update(file);
  hash.update(data);
}
writeFileSync(
  "dist/offline-manifest.json",
  JSON.stringify({ version: hash.digest("hex").slice(0, 16), bytes, files }),
);
console.log(
  `Offline course pack: ${files.length} files, ${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`,
);
