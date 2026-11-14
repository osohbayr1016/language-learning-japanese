-- Account-level IANA timezone and local-day reward accounting.
ALTER TABLE user_learning_preferences ADD COLUMN timezone TEXT
  NOT NULL DEFAULT 'Asia/Ulaanbaatar' CHECK(length(timezone) BETWEEN 1 AND 64);
ALTER TABLE reward_receipts ADD COLUMN activity_day TEXT
  CHECK(activity_day IS NULL OR activity_day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]');
DROP TRIGGER IF EXISTS reward_receipt_credit;
CREATE TRIGGER reward_receipt_credit AFTER INSERT ON reward_receipts
BEGIN
  INSERT INTO user_stats (user_id,total_xp,total_reviews,games_played)
  VALUES(new.user_id,new.xp_earned,new.review_count,CASE WHEN new.kind='game' THEN 1 ELSE 0 END)
  ON CONFLICT(user_id) DO UPDATE SET
    total_xp=user_stats.total_xp+excluded.total_xp,
    total_reviews=user_stats.total_reviews+excluded.total_reviews,
    games_played=user_stats.games_played+excluded.games_played;
  INSERT INTO user_daily_activity
    (user_id,activity_date,xp_earned,minutes_studied,sessions_count)
  VALUES (new.user_id,COALESCE(new.activity_day,date('now')),new.xp_earned,
    CASE WHEN new.kind='game' THEN CAST(ROUND(new.game_seconds/60.0) AS INTEGER) ELSE 0 END,
    CASE WHEN new.kind='game' THEN 1 ELSE 0 END)
  ON CONFLICT(user_id,activity_date) DO UPDATE SET
    xp_earned=user_daily_activity.xp_earned+excluded.xp_earned,
    minutes_studied=user_daily_activity.minutes_studied+excluded.minutes_studied,
    sessions_count=user_daily_activity.sessions_count+excluded.sessions_count,
    updated_at=CURRENT_TIMESTAMP;
  -- Streak updates join the very same transaction as XP and daily activity.
  INSERT INTO user_streaks
    (user_id,current_streak,longest_streak,last_activity_date,total_days_studied)
  VALUES(new.user_id,1,1,COALESCE(new.activity_day,date('now')),1)
  ON CONFLICT(user_id) DO UPDATE SET
    current_streak=CASE
      WHEN user_streaks.last_activity_date=excluded.last_activity_date
        THEN user_streaks.current_streak
      WHEN user_streaks.last_activity_date=date(excluded.last_activity_date,'-1 day')
        THEN user_streaks.current_streak+1
      WHEN user_streaks.last_activity_date>excluded.last_activity_date
        THEN user_streaks.current_streak
      ELSE 1 END,
    longest_streak=MAX(user_streaks.longest_streak,CASE
      WHEN user_streaks.last_activity_date=excluded.last_activity_date
        THEN user_streaks.current_streak
      WHEN user_streaks.last_activity_date=date(excluded.last_activity_date,'-1 day')
        THEN user_streaks.current_streak+1
      WHEN user_streaks.last_activity_date>excluded.last_activity_date
        THEN user_streaks.current_streak
      ELSE 1 END),
    last_activity_date=CASE
      WHEN user_streaks.last_activity_date>=excluded.last_activity_date
        THEN user_streaks.last_activity_date
      ELSE excluded.last_activity_date END,
    total_days_studied=user_streaks.total_days_studied+CASE
      WHEN user_streaks.last_activity_date>=excluded.last_activity_date THEN 0
      ELSE 1 END;
END;
