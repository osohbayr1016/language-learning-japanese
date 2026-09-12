import {
  alignTargetCharScores,
  levenshteinChars,
  moraRanges,
} from './speechScoringAlign';
import {
  extractJapaneseChars,
  foldReading,
  jaNorm,
  kanaMora,
  romajiChars,
  romajiTokens,
  toHiragana,
} from './speechScoringNormalize';

export type SpeechTarget = {
  /** Written form on the card — kanji and kana as the learner sees it. */
  jp: string;
  /** Kana reading of that written form, when the word has one. */
  kana: string;
  /** Romaji reading, used when the recognizer hands back latin text. */
  romaji: string;
};

export type CharSpeakGrade = {
  char: string;
  scorePercent: number;
  /** Mora of the reading that belong to this character. */
  readingPart: string;
};

export type UtteranceScore = {
  ratio: number;
  points: number;
  pass: boolean;
  /** Match against the written form (kanji + kana). */
  surfaceRatio: number;
  /** Match against the pronunciation (kana reading, or romaji). */
  readingRatio: number;
  charGrades: CharSpeakGrade[];
  finalPercent: number;
  /** Recognizer hypothesis this score was computed from. */
  matchedTranscript: string;
};

const PASS_RATIO = 0.62;

/** Blend of per-character alignment and whole-string edit distance, 0…1. */
function similarity(spoken: string[], target: string[]): number {
  if (target.length === 0 || spoken.length === 0) return 0;
  const seq = 1 - levenshteinChars(spoken, target) / Math.max(spoken.length, target.length);
  const scores = alignTargetCharScores(spoken, target);
  const mean = scores.reduce((a, b) => a + b, 0) / target.length;
  return Math.max(0, Math.min(1, 0.5 * mean + 0.5 * seq));
}

/**
 * Score one Japanese utterance against a target word or sentence.
 *
 * A `ja-JP` recognizer chooses its own orthography, so the same correct answer
 * can arrive as 食べる or たべる. Surface, reading and romaji are scored
 * separately and the best of the three wins — a learner is never penalised for
 * a transcription choice they had no control over.
 */
export function scoreJapaneseUtterance(spokenRaw: string, target: SpeechTarget): UtteranceScore {
  const targetChars = Array.from(jaNorm(target.jp));
  const spokenChars = extractJapaneseChars(spokenRaw);

  const targetSurface = Array.from(toHiragana(targetChars.join('')));
  const spokenSurface = Array.from(toHiragana(spokenChars.join('')));
  const surfaceRatio = similarity(spokenSurface, targetSurface);

  const targetReading = Array.from(foldReading(target.kana));
  const kanaRatio = targetReading.length
    ? similarity(Array.from(foldReading(spokenChars.join(''))), targetReading)
    : 0;

  const targetRomaji = romajiChars(target.romaji);
  const spokenRomaji = romajiChars(spokenRaw);
  const romajiRatio = similarity(spokenRomaji, targetRomaji);

  const readingRatio = Math.max(kanaRatio, romajiRatio);
  const ratio = Math.max(surfaceRatio, readingRatio);
  const points = Math.max(0, Math.min(100, Math.round(ratio * 100)));

  const mora = target.kana ? kanaMora(target.kana) : romajiTokens(target.romaji);
  const ranges = moraRanges(mora.length, targetChars.length);
  const charScores = targetChars.length ? alignTargetCharScores(spokenSurface, targetSurface) : [];
  const charGrades: CharSpeakGrade[] = targetChars.map((ch, j) => {
    const [a, b] = ranges[j] ?? [0, 0];
    return {
      char: ch,
      scorePercent: Math.round((charScores[j] ?? 0) * 100),
      readingPart: mora.slice(a, b).join(''),
    };
  });

  return {
    ratio,
    points,
    pass: ratio >= PASS_RATIO,
    surfaceRatio,
    readingRatio,
    charGrades,
    finalPercent: points,
    matchedTranscript: spokenRaw.trim(),
  };
}

/**
 * Score every hypothesis the recognizer offered and keep the best one.
 *
 * Japanese is dense with homophones (人生 / 人性, 一生 / 一升), so the top
 * hypothesis is often the right sounds written as the wrong word. The lower
 * alternatives usually carry the intended spelling.
 */
export function scoreBestJapaneseUtterance(
  candidates: readonly string[],
  target: SpeechTarget
): UtteranceScore {
  const seen = new Set<string>();
  let best: UtteranceScore | null = null;
  for (const candidate of candidates) {
    const text = candidate.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    const score = scoreJapaneseUtterance(text, target);
    if (!best || score.ratio > best.ratio) best = score;
  }
  return best ?? scoreJapaneseUtterance('', target);
}
