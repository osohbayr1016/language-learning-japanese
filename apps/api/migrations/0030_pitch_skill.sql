-- Migration 0030: Japanese uses pitch/accent, not Mandarin tone categories.
INSERT INTO user_skill_stats (user_id, skill, hits, total, updated_at)
SELECT user_id, 'pitch', hits, total, CURRENT_TIMESTAMP
FROM user_skill_stats
WHERE skill = 'tones'
ON CONFLICT(user_id, skill) DO UPDATE SET
  hits = user_skill_stats.hits + excluded.hits,
  total = user_skill_stats.total + excluded.total,
  updated_at = CURRENT_TIMESTAMP;

DELETE FROM user_skill_stats WHERE skill = 'tones';
