import type { ProgressResult } from "./progress";

export type StudyProgressBody = {
  results: ProgressResult[];
  xp_earned: number;
  session_type: "flashcard" | "learn" | "write" | "writer";
};

const integerIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
const numberIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const dateString = (value: unknown) =>
  typeof value === "string" && value.length >= 10 && value.length <= 40 &&
  /^\d{4}-\d{2}-\d{2}/.test(value) && Number.isFinite(Date.parse(value));

function validResult(value: unknown): value is ProgressResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return integerIn(row.word_id, 1, Number.MAX_SAFE_INTEGER) &&
    numberIn(row.ease_factor, 1, 5) &&
    integerIn(row.interval, 0, 36500) &&
    integerIn(row.repetitions, 0, 10000) &&
    dateString(row.next_review) &&
    (row.response_ms === undefined || numberIn(row.response_ms, 0, 3600000)) &&
    (row.confidence === undefined || numberIn(row.confidence, 0, 100)) &&
    (row.flashcard_eligible_at === undefined || row.flashcard_eligible_at === null ||
      dateString(row.flashcard_eligible_at));
}

/** Validate client-side SRS evidence before it can mutate XP, streak or progress. */
export function validStudyProgressBody(value: unknown): value is StudyProgressBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.results) || body.results.length > 100 ||
      !integerIn(body.xp_earned, 0, 1000) ||
      !["flashcard", "learn", "write", "writer"].includes(String(body.session_type))) return false;
  if (body.results.length === 0 && body.xp_earned > 0) return false;
  if (!body.results.every(validResult)) return false;
  const ids = body.results.map((row: ProgressResult) => row.word_id);
  return new Set(ids).size === ids.length;
}
