import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { mn } from '../../i18n/mn';
import { mockExamStyles as styles } from './mockExamStyles';

export type MockExamResultPayload = {
  knowledgeScore?:number;
  knowledgeCorrect?:number;
  knowledgeTotal?:number;
  total: number;
  max: number;
  line: number;
  passed: boolean;
  listeningScore: number;
  readingScore: number;
  durationSeconds: number;
  durationLimitMin: number;
  listeningCorrect: number;
  listeningTotal: number;
  readingCorrect: number;
  readingTotal: number;
};

function pct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function formatDur(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r} сек`;
  return r ? `${m} мин ${r} сек` : `${m} мин`;
}

function sectionInsight(
  lp: number,
  rp: number,
  lt: number,
  rt: number,
  s: typeof mn.study
): string {
  if (lt === 0 && rt === 0) return s.mockExamInsightBalanced;
  const d = lp - rp;
  if (Math.abs(d) < 8) return s.mockExamInsightBalanced;
  return d > 0 ? s.mockExamInsightListenStrong : s.mockExamInsightReadStrong;
}

function passInsight(total: number, line: number, passed: boolean, s: typeof mn.study): string {
  if (passed) return s.mockExamInsightPass;
  if (total >= line - 15 && total < line) return s.mockExamInsightAlmost;
  return s.mockExamInsightFail;
}

type Props = {
  result: MockExamResultPayload;
  onClose: () => void;
};

export function MockExamResultsView({ result, onClose }: Props) {
  const s = mn.study;
  const lp = pct(result.listeningCorrect, result.listeningTotal);
  const rp = pct(result.readingCorrect, result.readingTotal);
  const tp = result.max > 0 ? Math.round((result.total / result.max) * 1000) / 10 : 0;

  return (
    <View style={styles.resultsRoot}>
      <Text style={styles.h1}>{mn.common.done}</Text>
      <Text style={styles.p}>Дадлагын хувийг хэсгийн оноонд шилжүүлсэн үр дүн. Албан ёсны JLPT scaled score биш. Хэсэг бүрийн босгыг давах шаардлагатай.</Text>
      <Text style={styles.resultsLead}>
        {s.mockExamTotalPct.replace('{p}', String(tp)).replace('{s}', String(result.total)).replace('{max}', String(result.max))}{' '}
        {s.mockExamPassLineInline.replace('{line}', String(result.line))}
      </Text>

      <View style={styles.resultsCard}>
        <Text style={styles.resultsCardTit}>{s.mockExamResultHeadline}</Text>
        <Text style={styles.p}>
          <Text style={styles.resultsEm}>{s.mockExamTimeLabel}:</Text> {formatDur(result.durationSeconds)}{' '}
          <Text style={styles.resultsMuted}>
            ({s.mockExamTimeLimitHint.replace('{m}', String(result.durationLimitMin))})
          </Text>
        </Text>
        <Text style={styles.p}>
          {s.mockExamSectionRow
            .replace('{name}', s.mockExamListenShort)
            .replace('{ok}', String(result.listeningCorrect))
            .replace('{n}', String(result.listeningTotal))
            .replace('{pct}', String(lp))
            .replace('{score}', String(result.listeningScore))}
        </Text>
        <Text style={styles.p}>
          {s.mockExamSectionRow
            .replace('{name}', s.mockExamReadShort)
            .replace('{ok}', String(result.readingCorrect))
            .replace('{n}', String(result.readingTotal))
            .replace('{pct}', String(rp))
            .replace('{score}', String(result.readingScore))}
        </Text>
        <Text style={styles.p}>
          {s.mockExamAllQuestions
            .replace('{n}', String(result.listeningTotal + result.readingTotal))
            .replace('{ok}', String(result.listeningCorrect + result.readingCorrect))
            .replace(
              '{pct}',
              String(pct(result.listeningCorrect + result.readingCorrect, result.listeningTotal + result.readingTotal))
            )}
        </Text>
      </View>

      {!!result.knowledgeTotal&&<Text style={styles.p}>Хэлний мэдлэг: {result.knowledgeCorrect}/{result.knowledgeTotal} зөв · {result.knowledgeScore}/60</Text>}
      <View style={styles.insightCard}>
        <Text style={styles.insightTit}>{s.mockExamInsightTitle}</Text>
        <Text style={styles.insightP}>{passInsight(result.total, result.line, result.passed, s)}</Text>
        <Text style={[styles.insightP, styles.insightMuted, styles.insightPLast]}>
          {sectionInsight(lp, rp, result.listeningTotal, result.readingTotal, s)}
        </Text>
      </View>

      <Text style={styles.p}>{result.passed ? s.mockExamPassedShort : s.mockExamRetryShort}</Text>
      <Text style={[styles.p, styles.resultsMuted]}>{s.mockExamScoreBreakdown.replace('{l}', String(result.listeningScore)).replace('{r}', String(result.readingScore))}</Text>

      <Pressable style={styles.doneExit} onPress={onClose}>
        <Text style={styles.doneExitTx}>{s.mockExamDoneExit}</Text>
      </Pressable>
    </View>
  );
}
