-- Adds the workout_notes column to the sessions table.
-- Run once against the target database; safe to skip if already applied.
ALTER TABLE sessions
ADD COLUMN workout_notes TEXT;
