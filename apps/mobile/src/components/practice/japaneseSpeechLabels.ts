import { mn } from '../../i18n/mn';

export function speakFinalLine(finalPercent: number, hideMongolian: boolean): string {
  return hideMongolian
    ? `Score: ${finalPercent}/100`
    : mn.study.speakFinalGrade.replace('{n}', String(finalPercent));
}

/**
 * Written-form and pronunciation scores, side by side.
 *
 * Only channels that actually carry evidence are shown: when the recognizer
 * transcribes a word in kanji there is no separate reading signal, and printing
 * "Reading 0%" next to a perfect score would just read as a contradiction.
 */
export function speakBreakdown(wordPct: number, readingPct: number, hideMongolian: boolean): string {
  const parts: string[] = [];
  if (wordPct > 0 || readingPct === 0) {
    parts.push(
      hideMongolian ? `Word ${wordPct}%` : mn.study.speakWordScore.replace('{n}', String(wordPct))
    );
  }
  if (readingPct > 0) {
    parts.push(
      hideMongolian
        ? `Reading ${readingPct}%`
        : mn.study.speakReadingScore.replace('{n}', String(readingPct))
    );
  }
  return parts.join(' · ');
}

export function speakPermissionDeniedLines(hideMongolian: boolean): {
  breakdown: string;
  finalLine: string;
} {
  return hideMongolian
    ? { breakdown: 'Microphone permission denied', finalLine: 'Score: 0/100' }
    : { breakdown: 'Зөвшөөрөл аваагүй', finalLine: mn.study.speakFinalGrade.replace('{n}', '0') };
}

export function speakExampleAside(exampleJp: string, hideMongolian: boolean): string {
  return hideMongolian
    ? `Example: ${exampleJp}`
    : mn.study.speakExampleHint.replace('{s}', exampleJp);
}

export function speakMicListeningHintEn(): string {
  return 'Tap again to stop; recording stops automatically after a few seconds. Audio is not stored.';
}

export function speakOutcomeBlock(opts: {
  hideMongolian: boolean;
  submitted: boolean;
  points: number | null;
  transcript: string | null;
  finalLine: string | null;
  breakdown: string | null;
  passedRound: boolean | null;
}): string {
  const { hideMongolian, submitted, points, transcript, finalLine, breakdown, passedRound } = opts;
  if (!(submitted && points !== null)) {
    return hideMongolian
      ? 'Tap the mic and say the phrase in Japanese.'
      : 'Микрофон дараад өгүүлбэрийг япондоор хэлээрэй';
  }
  const lines = hideMongolian
    ? [
        `Points: ${points}/100`,
        transcript ? `You said: «${transcript}»` : '',
        finalLine ?? '',
        breakdown ?? '',
        passedRound ? 'Result: Pass' : 'Result: Try again',
      ]
    : [
        `Оноо: ${points}/100`,
        transcript ? `Таны хэлсэн: «${transcript}»` : '',
        finalLine ?? '',
        breakdown ?? '',
        passedRound ? 'Дүнд: Тэнцсэн' : 'Дүнд: Тэнцээгүй',
      ];
  return lines.filter(Boolean).join('\n');
}
