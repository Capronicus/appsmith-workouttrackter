-- Run once against fitnessDB.
-- Stores one in-progress workout draft per template. Deleted on completion.

CREATE TABLE IF NOT EXISTS workout_drafts (
  id          SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  draft_data  JSONB   NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one draft per workout template at a time.
CREATE UNIQUE INDEX IF NOT EXISTS workout_drafts_template_id_idx
  ON workout_drafts(template_id);
