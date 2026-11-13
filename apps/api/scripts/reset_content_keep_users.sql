-- =============================================================================
-- Reset: all learning content scratch; KEEP users + refresh_tokens only.
-- Irreversible. R2 objects (cached TTS) are NOT deleted — orphan keys possible.
--
-- Local D1:
--   cd apps/api && pnpm exec wrangler d1 execute nihongo-mn-db --local --file=./scripts/reset_content_keep_users.sql
--
-- Remote / production (only when you intend to wipe live content):
--   cd apps/api && pnpm exec wrangler d1 execute nihongo-mn-db --remote --file=./scripts/reset_content_keep_users.sql
--   (Add --env production if your wrangler.toml binds the DB under that env.)
--
-- Verify:
--   wrangler d1 execute nihongo-mn-db --local --command "SELECT (SELECT COUNT(*) FROM users) AS u, (SELECT COUNT(*) FROM words) AS w, (SELECT COUNT(*) FROM chapters) AS c"
-- =============================================================================

PRAGMA foreign_keys = OFF;

DELETE FROM user_exam_answers;
DELETE FROM user_exam_sessions;
DELETE FROM exam_questions;
DELETE FROM exam_templates;

DELETE FROM user_grammar_progress;
DELETE FROM grammar_exercises;
DELETE FROM grammar_lessons;

DELETE FROM cartoon_words;
DELETE FROM cartoons;

DELETE FROM user_lesson_progress;
DELETE FROM lesson_words;
DELETE FROM lessons;
DELETE FROM chapters;

DELETE FROM user_word_progress;
DELETE FROM audio_cache;

DELETE FROM user_daily_activity;
DELETE FROM user_skill_stats;
DELETE FROM game_sessions;

DELETE FROM course_words;
DELETE FROM courses;

DELETE FROM words;

UPDATE user_stats SET
  total_xp = 0,
  words_learned = 0,
  words_mastered = 0,
  total_reviews = 0,
  lessons_completed = 0,
  perfect_lessons = 0,
  games_played = 0;

UPDATE user_streaks SET
  current_streak = 0,
  longest_streak = 0,
  last_activity_date = NULL,
  total_days_studied = 0;

DELETE FROM sqlite_sequence WHERE name IN (
  'words',
  'audio_cache',
  'courses',
  'course_words',
  'chapters',
  'lessons',
  'lesson_words',
  'user_word_progress',
  'user_lesson_progress',
  'cartoons',
  'cartoon_words',
  'grammar_lessons',
  'grammar_exercises',
  'user_grammar_progress',
  'exam_templates',
  'exam_questions',
  'user_exam_sessions',
  'user_exam_answers',
  'game_sessions',
  'user_daily_activity',
  'user_skill_stats'
);

PRAGMA foreign_keys = ON;
