/** Local calendar date prevents the 08:00 UTC rollover for Mongolian learners. */
export const DEFAULT_STUDY_TIMEZONE = "Asia/Ulaanbaatar";

export function validStudyTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64 ||
      !/^[A-Za-z0-9_+\/-]+$/.test(value)) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0); return true; }
  catch { return false; }
}
export function studyLocalDay(
  timezone: string = DEFAULT_STUDY_TIMEZONE,
  at: Date = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: validStudyTimeZone(timezone) ? timezone : DEFAULT_STUDY_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(at);
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function previousStudyDay(day: string): string {
  return new Date(Date.parse(day + "T12:00:00Z") - 86400000).toISOString().slice(0, 10);
}
export function visibleCurrentStreak(value: number, last: string | null, today: string) {
  return last === today || last === previousStudyDay(today) ? value : 0;
}
