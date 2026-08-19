import React, { useEffect, useState } from "react";
import { Screen } from "../../primitives";
import { useGamification } from "../../context/GamificationContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { HomeHeader } from "./HomeHeader";
import { DueTodayCard } from "./DueTodayCard";
import { DailyGoalCard } from "./DailyGoalCard";
import { LeaderboardPreview } from "./LeaderboardPreview";
import { LearnedWordsSection } from "./LearnedWordsSection";

export default function HomeScreen() {
  const { stats, streak, dueToday, dailyGoal, refresh } = useGamification();
  const { token } = useAuth();
  const [name, setName] = useState("Сурагч");

  useEffect(() => {
    void refresh();
    if (!token) return;
    void (async () => {
      try {
        const p = await api.user.profile(token);
        setName(p.data.display_name || "Сурагч");
      } catch {
        /* ignore */
      }
    })();
  }, [refresh, token]);

  return (
    <Screen scroll scrollBottomInset={70}>
      <HomeHeader name={name} streak={streak?.current_streak ?? 0} />
      <LearnedWordsSection />
      <DueTodayCard dueCount={dueToday} />
      <DailyGoalCard totalXp={stats?.total_xp ?? 0} goal={dailyGoal} />
      <LeaderboardPreview />
    </Screen>
  );
}
