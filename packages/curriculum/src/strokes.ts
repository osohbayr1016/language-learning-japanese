export type Point = { x: number; y: number };
/** Compare ordered, arc-length-resampled paths in KanjiVG's 109-unit coordinate space. */
export function matchesStroke(input: Point[], target: Point[]): boolean {
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const resample = (points: Point[], n: number) => {
    const lengths = [0];
    for (let i = 1; i < points.length; i++)
      lengths.push(lengths[i - 1] + dist(points[i - 1], points[i]));
    const total = lengths.at(-1) ?? 0;
    if (total < 1) return [];
    return Array.from({ length: n }, (_, i) => {
      const at = (i / (n - 1)) * total;
      let j = 1;
      while (j < lengths.length - 1 && lengths[j] < at) j++;
      const t = (at - lengths[j - 1]) / (lengths[j] - lengths[j - 1] || 1);
      return {
        x: points[j - 1].x + (points[j].x - points[j - 1].x) * t,
        y: points[j - 1].y + (points[j].y - points[j - 1].y) * t,
      };
    });
  };
  if (
    input.length < 3 ||
    target.length < 3 ||
    !input.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  )
    return false;
  const a = resample(input, 24),
    b = resample(target, 24);
  if (!a.length || !b.length) return false;
  const errors = a.map((p, i) => dist(p, b[i]));
  const pathLength = (p: Point[]) =>
    p.slice(1).reduce((n, v, i) => n + dist(p[i], v), 0);
  const ratio = pathLength(input) / pathLength(target);
  return (
    errors[0] < 14 &&
    errors.at(-1)! < 14 &&
    errors.reduce((s, v) => s + v, 0) / errors.length < 10 &&
    Math.max(...errors) < 23 &&
    ratio > 0.55 &&
    ratio < 1.8
  );
}
