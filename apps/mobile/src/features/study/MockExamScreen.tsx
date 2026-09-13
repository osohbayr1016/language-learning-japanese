import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '../../lib/navigation/safeBack';
import { EmptyState, Screen } from '../../primitives';
import { ProfileScreenBackBar } from '../profile/ProfileScreenBackBar';
import { useAuth } from '../../context/AuthContext';
import { mn } from '../../i18n/mn';
import { colors } from '../../theme';
import { mockExamStyles as styles } from './mockExamStyles';
import { MockExamTemplatePicker } from './MockExamTemplatePicker';
import { MockExamRunView } from './MockExamRunView';
import { MockExamResultsView } from './MockExamResultsView';
import { useMockExamSession } from './useMockExamSession';

export function MockExamScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { templateId: templateIdParam } = useLocalSearchParams<{ templateId?: string }>();
  const initialTemplateId = useMemo(() => {
    const n = Number(templateIdParam);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  }, [templateIdParam]);
  const hook = useMockExamSession(token, initialTemplateId);

  const { sid, qs, idx, setIdx, ans, result, loadingList, starting, startFailed, deeplinkInvalid, selectable, begin, pick } =
    hook;
  const cur = qs[idx];
  const totalQ = qs.length;

  const submitAll = () => void hook.submitAll();
  const exit = () => safeBack(router, '/(tabs)/study');

  if (!token) {
    return (
      <Screen edges={['top']}>
        <ProfileScreenBackBar title="Загвар шалгалт" fallback="/(tabs)/study" style={{ marginBottom: 8 }} />
        <EmptyState
          icon="log-in-outline"
          title={mn.auth.loginTitle}
          body="Загвар шалгалт бүртгэлтэй хэрэглэгчид нээлттэй."
          actionLabel={mn.auth.signIn}
          onAction={() => router.push('/login' as never)}
          secondaryLabel={mn.common.back}
          onSecondary={exit}
        />
      </Screen>
    );
  }

  if (loadingList) {
    return (
      <Screen edges={['top']}>
        <ActivityIndicator color={colors.brand.primary} />
      </Screen>
    );
  }

  if (deeplinkInvalid) {
    return (
      <Screen edges={['top']} scroll>
        <ProfileScreenBackBar title="Загвар шалгалт" fallback="/(tabs)/study" style={{ marginBottom: 8 }} />
        <EmptyState
          icon="link-outline"
          tone="warning"
          title="Шалгалт олдсонгүй"
          body={mn.study.mockExamDeeplinkInvalid}
          actionLabel={mn.common.back}
          onAction={exit}
        />
      </Screen>
    );
  }

  if (sid === null) {
    if (selectable.length === 0 || startFailed) {
      return (
        <Screen edges={['top']}>
        <ProfileScreenBackBar title="Загвар шалгалт" fallback="/(tabs)/study" style={{ marginBottom: 8 }} />
          <EmptyState
            icon={startFailed ? 'cloud-offline-outline' : 'document-text-outline'}
            tone={startFailed ? 'warning' : 'neutral'}
            title={startFailed ? 'Шалгалт эхлүүлж чадсангүй' : 'Загвар шалгалт алга'}
            body={
              startFailed
                ? 'Интернэт холболтоо шалгаад дахин оролдоно уу.'
                : 'Шалгалтууд нэмэгдэхээр энд харагдана. Одоохондоо үг хэллэгээ давтаарай.'
            }
            actionLabel={startFailed ? 'Дахин оролдох' : mn.tabs.study}
            onAction={startFailed ? () => router.replace('/study/mock-exam' as never) : exit}
            secondaryLabel={startFailed ? mn.common.back : undefined}
            onSecondary={startFailed ? exit : undefined}
          />
        </Screen>
      );
    }
    if (selectable.length > 1) {
      return (
        <Screen edges={['top']} scroll>
          {starting ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={mn.common.back}
                style={styles.pickerBack}
                onPress={exit}
                hitSlop={12}
              >
                <Text style={styles.pickerBackTx}>{mn.common.back}</Text>
              </Pressable>
              <ActivityIndicator color={colors.brand.primary} />
            </>
          ) : (
            <MockExamTemplatePicker templates={selectable} onPick={(id) => void begin(id)} onBack={exit} />
          )}
        </Screen>
      );
    }
    return (
      <Screen edges={['top']}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mn.common.back}
          style={styles.pickerBack}
          onPress={exit}
          hitSlop={12}
        >
          <Text style={styles.pickerBackTx}>{mn.common.back}</Text>
        </Pressable>
        <ActivityIndicator color={colors.brand.primary} />
      </Screen>
    );
  }

  if (result) {
    return (
      <Screen edges={['top']} scroll>
        <MockExamResultsView result={result} onClose={exit} />
      </Screen>
    );
  }

  if (!cur || totalQ === 0) {
    return (
      <Screen edges={['top']}>
        <Text style={styles.muted}>{mn.study.courseEmpty}</Text>
      </Screen>
    );
  }

  return (
    <MockExamRunView
      cur={cur}
      idx={idx}
      totalQ={totalQ}
      ansForCur={ans[cur.id] ?? ''}
      onPick={pick}
      onPrev={() => setIdx((i) => Math.max(i - 1, 0))}
      onNext={() => setIdx((i) => Math.min(i + 1, totalQ - 1))}
      onSubmit={submitAll}
      onExit={exit}
    />
  );
}
