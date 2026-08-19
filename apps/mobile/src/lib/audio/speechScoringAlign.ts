export function levenshteinChars(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n];
}

/** Per-target-character match scores from optimal global alignment (0/1). */
export function alignTargetCharScores(spokenChars: string[], targetChars: string[]): number[] {
  const n = targetChars.length;
  if (n === 0) return [];
  const m = spokenChars.length;
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));
  const bt = Array.from({ length: m + 1 }, () => Array<string | null>(n + 1).fill(null));

  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
    bt[i][0] = 'u';
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
    bt[0][j] = 'l';
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sub = spokenChars[i - 1] === targetChars[j - 1] ? 0 : 1;
      const cDiag = dp[i - 1][j - 1] + sub;
      const cUp = dp[i - 1][j] + 1;
      const cLeft = dp[i][j - 1] + 1;
      const best = Math.min(cDiag, cUp, cLeft);
      dp[i][j] = best;
      if (best === cDiag) bt[i][j] = sub === 0 ? 'm' : 's';
      else if (best === cUp) bt[i][j] = 'u';
      else bt[i][j] = 'l';
    }
  }

  const scores = Array<number>(n).fill(0);
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const op = bt[i][j];
    if (op === 'm') {
      scores[j - 1] = 1;
      i -= 1;
      j -= 1;
    } else if (op === 's') {
      scores[j - 1] = 0;
      i -= 1;
      j -= 1;
    } else if (op === 'u') {
      i -= 1;
    } else if (op === 'l') {
      scores[j - 1] = 0;
      j -= 1;
    } else break;
  }
  return scores;
}

/** [start, end) mora indices of the reading that belong to each target character. */
export function moraRanges(nMora: number, nChar: number): [number, number][] {
  if (nChar === 0) return [];
  if (nMora === 0) return Array.from({ length: nChar }, () => [0, 0] as [number, number]);
  if (nMora >= nChar) {
    return Array.from({ length: nChar }, (_, j) => {
      const a = Math.floor((j * nMora) / nChar);
      const b = Math.floor(((j + 1) * nMora) / nChar);
      return [a, b] as [number, number];
    });
  }
  return Array.from({ length: nChar }, (_, j) =>
    j < nMora ? ([j, j + 1] as [number, number]) : ([nMora, nMora] as [number, number])
  );
}
