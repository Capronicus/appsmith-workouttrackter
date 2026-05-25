-- Normalises exercise_muscles.intensity to match the role tiers
-- (Primary=5, Secondary=3, Stabilizer=1).
-- Run once; fine to re-run (idempotent values).
UPDATE exercise_muscles
SET intensity =
    CASE role
        WHEN 'Primary'    THEN 5
        WHEN 'Secondary'  THEN 3
        WHEN 'Stabilizer' THEN 1
    END;
