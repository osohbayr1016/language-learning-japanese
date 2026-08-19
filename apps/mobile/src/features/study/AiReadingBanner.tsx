import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export function AiReadingBanner() {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.banner, pressed && { opacity: 0.85 }]}
      onPress={() => router.push('/study/ai-reading' as any)}
    >
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Шинэ</Text>
        </View>
        <Text style={styles.title}>AI Уншлага 🤖</Text>
        <Text style={styles.subtitle}>Таны сурсан үгнүүд дээр суурилан өгүүллэг уншиж, шинэ 2 үг сураарай!</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  content: { flex: 1, gap: spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  badgeText: { ...typography.body.xs, color: '#fff', fontWeight: '800' },
  title: { ...typography.heading.sm, color: '#fff' },
  subtitle: { ...typography.body.xs, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 18 },
});
