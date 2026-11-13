import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '../../lib/navigation/safeBack';
import { Screen } from '../../primitives';
import { api } from '../../lib/api';
import type { CartoonDetail, CartoonWord } from '../../lib/api/cartoons';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { colors, spacing, typography } from '../../theme';
import { mn } from '../../i18n/mn';
import { VideoPlayer, type PlayerHandle } from './VideoPlayer';
import { VocabOverlay } from './VocabOverlay';
import { VocabSheet } from './VocabSheet';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const { addLocalXp } = useGamification();
  const playerRef = useRef<PlayerHandle>(null);

  const [data, setData] = useState<CartoonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [activeWord, setActiveWord] = useState<CartoonWord | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const r = await api.cartoons.get(Number(id), token ?? undefined);
        setData(r.data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  const handlePick = async (w: CartoonWord) => {
    await playerRef.current?.pause();
    setActiveWord(w);
  };

  const handleClose = async () => {
    setActiveWord(null);
    await playerRef.current?.play();
  };

  const handleComplete = () => {
    addLocalXp(15);
  };

  if (loading) {
    return <Screen><View style={styles.center}><ActivityIndicator color={colors.accent.purple} /></View></Screen>;
  }
  if (error || !data) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errText}>{error ?? 'Хүүхэлдэй олдсонгүй'}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => safeBack(router, '/(tabs)/cartoons')} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>{data.title_mn}</Text>
      </View>
      <View style={styles.videoWrap}>
        <VideoPlayer
          ref={playerRef}
          uri={data.video_url}
          onTimeUpdate={setTime}
          onComplete={handleComplete}
        />
        <VocabOverlay vocab={data.vocab} currentTime={time} onPick={handlePick} />
      </View>
      <View style={styles.hintRow}>
        <Ionicons name="information-circle-outline" size={16} color={colors.text.secondary} />
        <Text style={styles.hint}>{'Тодруулсан үг дээр дарж утгыг хараарай.'}</Text>
      </View>
      <VocabSheet word={activeWord} onClose={handleClose} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errText: { ...typography.body.lg, color: colors.text.secondary },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  back: { padding: 4 },
  title: { ...typography.heading.md, color: colors.text.primary, flex: 1 },
  videoWrap: { width: '100%', position: 'relative' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.md },
  hint: { ...typography.body.sm, color: colors.text.secondary, flex: 1 },
});
