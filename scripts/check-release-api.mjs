const base =
  process.env.JAPANESE_API_URL ??
  "https://nihongo-mn-api.osohoo691016.workers.dev";
const response = await fetch(base + "/health", {
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw Error("Japanese API health check failed");
const data = await response.json();
if (data.course_schema !== 4)
  throw Error(
    "Deploy the Japanese API and migrations 0031–0034 before the web",
  );
console.log("Japanese API supports the current course contract");
