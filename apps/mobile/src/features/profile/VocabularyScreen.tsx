import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { EmptyState, Screen } from '../../primitives';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { WordWithProgress } from '../../lib/types';
import { mn } from '../../i18n/mn';
import { colors, spacing, typography } from '../../theme';
import { VocabularyWordRow } from './VocabularyWordRow';
import { VocabularyTextbookFilterRow } from './VocabularyTextbookFilterRow';
import { ProfileScreenBackBar } from './ProfileScreenBackBar';

export function VocabularyScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WordWithProgress[]>([]);
  const offsetRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterUnit, setFilterUnit] = useState('');
  const [draftUnit, setDraftUnit] = useState('');
  const limit = 40;

  const fetchPage = useCallback(
    async (reset: boolean, unitSnapshot?: string) => {
      if (!token) return;
      const unit = unitSnapshot !== undefined ? unitSnapshot : filterUnit;
      const start = reset ? 0 : offsetRef.current;
      if (reset) setLoading(true);
      else setLoadingMore(true);
      try {
        const u = unit.trim();
        const res = await api.user.vocabulary(token, {
          limit,
          offset: start,
          ...(u ? { textbook_unit: u } : {}),
        });
        const chunk = res.data ?? [];
        if (reset) {
          setItems(chunk);
          offsetRef.current = chunk.length;
        } else {
          setItems((prev) => [...prev, ...chunk]);
          offsetRef.current = start + chunk.length;
        }
        setHasMore(Boolean(res.has_more));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [token, limit, filterUnit]
  );

  useEffect(() => {
    if (!token) return;
    void fetchPage(true);
  }, [token, filterUnit, fetchPage]);

  const promote = async (wordId: number) => {
    if (!token) return;
    await api.user.vocabularyFlashcardNow(token, wordId);
    void fetchPage(true);
  };

  const applyUnitFilter = () => {
    const next = draftUnit.trim();
    setFilterUnit(next);
    offsetRef.current = 0;
  };

  if (!token) {
    return (
      <Screen>
        <Text style={styles.muted}>{mn.common.loading}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ProfileScreenBackBar
        title={mn.profile.seenWords}
        fallback="/(tabs)/profile"
        style={{ paddingBottom: spacing.sm }}
      />
      <Text style={styles.hint}>{mn.profile.seenWordsHint}</Text>
      <VocabularyTextbookFilterRow
        draft={draftUnit}
        onDraft={setDraftUnit}
        onApply={() => applyUnitFilter()}
        disabled={loading && items.length === 0}
      />
      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.brand.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(w) => String(w.id)}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void fetchPage(true);
          }}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) void fetchPage(false);
          }}
          ListEmptyComponent={
            <EmptyState
              icon="albums-outline"
              tone="neutral"
              title="Үзсэн үг алга"
              body="Хичээл, давталт хийхэд орсон үгс энд цугларна."
              actionLabel={mn.tabs.study}
              onAction={() => router.push('/(tabs)/study' as never)}
            />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.brand.primary} style={{ padding: spacing.md }} /> : null
          }
          renderItem={({ item }) => (
            <VocabularyWordRow
              item={item}
              onOpenDetail={(wid) => router.push(`/profile/word/${wid}` as Href)}
              onPromote={(wid) => void promote(wid)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.body.sm,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  muted: { ...typography.body.md, color: colors.text.muted, padding: spacing.md },
});
