import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, SectionHeading } from '../../primitives';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { mn } from '../../i18n/mn';
import { spacing } from '../../theme';
import { HomeHeader } from './HomeHeader';
import { DueTodayCard } from './DueTodayCard';
import { DailyGoalCard } from './DailyGoalCard';
import { Hsk1ProgramSection } from '../study/Hsk1ProgramSection';
import { LeaderboardPreview } from './LeaderboardPreview';

export default function HomeScreen() {
  const { stats, streak, dueToday, dailyGoal, refresh } = useGamification();
  const { token } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('Сурагч');

  useEffect(() => {
    void refresh();
    if (!token) return;
    void (async () => {
      try {
        const p = await api.user.profile(token);
        setName(p.data.display_name || 'Сурагч');
      } catch {
        /* ignore */
      }
    })();
  }, [refresh, token]);

  return (
    <Screen scroll scrollBottomInset={74}>
      <HomeHeader name={name} streak={streak?.current_streak ?? 0} />

      {/* Ordered as the day actually goes: finish what's due, check the goal,
          then move the course forward. The sections used to run together with
          no labels, so the page read as a pile of cards. */}
      <SectionHeading title="Өнөөдөр" subtitle="Эхлээд давталтаа дуусга" />
      <DueTodayCard dueCount={dueToday} />
      <DailyGoalCard totalXp={stats?.total_xp ?? 0} goal={dailyGoal} />

      <View style={{ marginTop: spacing.sm }}>
        <SectionHeading
          title={mn.study.hsk1LessonsTitle}
          subtitle="Хөтөлбөрөө үргэлжлүүл"
          actionLabel={mn.tabs.study}
          onAction={() => router.push('/(tabs)/study' as never)}
        />
        <Hsk1ProgramSection hideTitle />
      </View>

      <LeaderboardPreview />
    </Screen>
  );
}
