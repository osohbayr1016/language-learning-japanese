import React from 'react';
import { Link } from 'react-router-dom';
import { useGamification } from '@src/context/GamificationContext';

export function WebRightRail() {
  const { streak, todayXp, dailyGoal, stats } = useGamification();
  const goal = Math.max(1, dailyGoal);
  const pct = Math.min(100, Math.round((todayXp / goal) * 100));

  return (
    <aside className="right-rail" aria-label="Өдрийн явц">
      <section className="rail-card rail-card--goal">
        <div className="rail-card__eyebrow">ӨНӨӨДРИЙН ЗОРИЛГО</div>
        <div className="rail-goal__top">
          <strong>{todayXp}/{goal} XP</strong>
          <span>{pct}%</span>
        </div>
        <div className="rail-progress" aria-label={`Өдрийн зорилго ${pct}%`}>
          <div className="rail-progress__fill" style={{ width: `${pct}%` }} />
        </div>
        <p>
          {pct >= 100
            ? 'Өнөөдрийн зорилго биеллээ. Дараагийн хичээлээ хүсвэл үргэлжлүүлээрэй.'
            : `${Math.max(0, goal - todayXp)} XP үлдлээ.`}
        </p>
      </section>

      <section className="rail-card">
        <div className="rail-stat">
          <span className="rail-stat__icon" aria-hidden="true">🔥</span>
          <div>
            <strong>{streak?.current_streak ?? 0} өдөр</strong>
            <span>дараалсан суралцалт</span>
          </div>
        </div>
        <div className="rail-stat">
          <span className="rail-stat__icon" aria-hidden="true">✨</span>
          <div>
            <strong>{stats?.total_xp ?? 0} XP</strong>
            <span>нийт цуглуулсан</span>
          </div>
        </div>
      </section>

      <section className="rail-card rail-card--tip">
        <div className="rail-card__eyebrow">СУРАЛЦАХ ЗӨВЛӨМЖ</div>
        <strong>Өдөр бүр бага багаар</strong>
        <p>15 минутын тогтмол давталт нь нэг удаагийн урт суултаас илүү тогтвортой.</p>
        <Link to="/profile/insights" className="rail-link">Явцаа харах →</Link>
      </section>
    </aside>
  );
}
