import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LeaderboardRow } from '../../components/gamification';
import { SectionHeading } from '../../primitives';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { LeaderboardRow as Row } from '../../lib/api/games';
import { spacing } from '../../theme';
import { mn } from '../../i18n/mn';

export function LeaderboardPreview() {
  const { token } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const r = await api.games.leaderboard(token);
        setRows(r.data.slice(0, 3));
      } catch {
        /* ignore */
      }
    })();
  }, [token]);

  if (rows.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeading
        title={mn.home.leaderboard}
        subtitle="Энэ долоо хоногийн тэргүүлэгчид"
        actionLabel={mn.tabs.games}
        onAction={() => router.push('/(tabs)/games' as never)}
      />
      {rows.map((r, i) => (
        <LeaderboardRow key={`${r.display_name}-${i}`} row={r} rank={i + 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
});
