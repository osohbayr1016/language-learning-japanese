-- Keep historical attempts intact; do not reinterpret old 200-point results as JLPT.
ALTER TABLE exam_questions ADD COLUMN scoring_section TEXT CHECK(scoring_section IN ('knowledge','reading','listening'));
ALTER TABLE user_exam_sessions ADD COLUMN knowledge_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exam_templates ADD COLUMN qualifies_for_level_gate INTEGER NOT NULL DEFAULT 0;
-- Old templates need review and re-import with a Japanese 180-point schema.
UPDATE exam_templates SET is_published=0 WHERE max_score<>180;
