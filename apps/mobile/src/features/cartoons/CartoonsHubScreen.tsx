import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../primitives';
import { api } from '../../lib/api';
import type { Cartoon } from '../../lib/api/cartoons';
import { CartoonCard } from '../../components/cards/CartoonCard';
import { colors, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';

export default function CartoonsHubScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Cartoon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.cartoons.list();
      setItems(result.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Сүлжээний алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <Screen padded scroll={false}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{mn.cartoons.hub}</Text>
        <Text style={styles.subheading}>{mn.cartoons.tapWord}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.accent.purple} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Text accessibilityRole="alert" style={styles.emptyTitle}>Видео ачаалж чадсангүй</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Дахин оролдох"
            style={styles.emptyCta} onPress={() => { void load(); }}>
            <Text style={styles.emptyCtaText}>Дахин оролдох</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{mn.cartoons.emptyHeadline}</Text>
          <Text style={styles.emptyBody}>{mn.cartoons.emptyBody}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mn.cartoons.emptyCta}
            style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
            onPress={() => router.push('/(tabs)/study')}
          >
            <Text style={styles.emptyCtaText}>{mn.cartoons.emptyCta}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => <CartoonCard cartoon={item} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { marginBottom: spacing.lg, marginTop: spacing.sm },
  heading: { ...typography.heading.xl, color: colors.text.primary },
  subheading: { ...typography.body.md, color: colors.text.secondary, marginTop: 4 },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: { ...typography.heading.md, color: colors.text.primary, textAlign: 'center' },
  emptyBody: { ...typography.body.md, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  emptyCta: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    backgroundColor: colors.brand.primary,
  },
  emptyCtaPressed: { opacity: 0.9 },
  emptyCtaText: { ...typography.body.md, fontWeight: '700' as const, color: colors.text.inverse },
});
