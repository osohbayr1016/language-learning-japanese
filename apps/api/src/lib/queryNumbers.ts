/** Parse a non-negative query integer without passing NaN, Infinity or huge offsets to D1. */
export function boundedInteger(
  input: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (input === undefined || !/^[0-9]+$/.test(input)) return fallback;
  const parsed = Number(input);
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/** Identifiers must be actual positive safe integers, not floats or scientific notation. */
export function positiveId(input: string): number | null {
  if (!/^[1-9][0-9]*$/.test(input)) return null;
  const parsed = Number(input);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
