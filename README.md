# Workout Tracker

Personal fitness tracking app built with [Appsmith](https://appsmith.com) and PostgreSQL.

---

## Pages

| Page | Purpose |
|---|---|
| **Home** | Session log — view recent workouts, delete sessions, wipe data |
| **Exercises** | Exercise library — create/edit exercises, assign muscle groups and roles |
| **Workouts** | Template builder — define workout templates with ordered exercises and default sets/reps/weight |
| **LogWorkouts** | Logging — pick a template, mark exercises done, enter actual reps/weight/feel, submit |

---

## Database schema

```
exercises
  id, name, notes, image_url

muscles
  id, name

exercise_muscles
  exercise_id  → exercises.id
  muscle_id    → muscles.id
  role         TEXT  (Primary | Secondary | Stabilizer)
  intensity    INT   (5 | 3 | 1, derived from role)

workout_templates
  id, name, notes

template_exercises
  id
  template_id  → workout_templates.id
  exercise_id  → exercises.id
  default_sets, default_reps, default_weight
  display_order

sessions
  id
  template_id  → workout_templates.id  (ON DELETE SET NULL)
  session_date, completed_at
  workout_notes

session_sets
  session_id   → sessions.id
  exercise_id  → exercises.id
  set_number, reps, weight, feel, exercise_notes
```

---

## Key logic

**LogState** (`LogWorkouts/jsobjects/LogState`) manages the logging flow:

- `toggle(id)` / `isDone(id)` — track which exercises the user has marked done
- `complete()` — inserts a session, iterates done exercises, inserts one row per set, updates template defaults with the logged weight/reps, clears store
- `clearStore()` — removes all temporary `appsmith.store` keys (`reps_*`, `weight_*`, `feel_*`, `notes_*`, `inserting*`, `updating*`)

**appsmith.store temporary keys** (cleared after each log):

| Prefix | Purpose |
|---|---|
| `weight_<teId>` | Per-exercise weight input |
| `feel_<teId>` | Per-exercise feel radio (lower/same/higher) |
| `notes_<teId>` | Per-exercise notes input |
| `reps_<teId>_<setNum>` | Per-set reps input |
| `inserting*` | Pass-through values for InsertSessionSet query |
| `updating*` | Pass-through values for UpdateTemplateDefaults query |

---

## Migrations

One-time SQL scripts live in `database/migrations/`. They have already been applied to the production database and are kept here for reference only.

| File | Description |
|---|---|
| `001_add_workout_notes_to_sessions.sql` | Added `workout_notes TEXT` column to `sessions` |
| `002_normalize_muscle_intensity.sql` | Back-filled `intensity` from `role` values |

---

## Deployment

The app runs on a self-hosted Appsmith instance at `apps.homene.st`. The database is a PostgreSQL instance registered as datasource `fitnessDB`.

**Git sync workflow:**
1. Edit locally (or in the Appsmith editor)
2. Commit and push to `main`
3. In Appsmith: bottom toolbar → Git → Pull

---

## Known limitations / future work

- **appsmith.store as transport layer** — `InsertSessionSet` and `UpdateTemplateDefaults` receive their parameters via `storeValue()` calls rather than direct query params. Appsmith query params (`query.run({ ... })`) would be cleaner.
- **`InsertExerciseInline`** — the inline add-row query on `tblExercises` references `muscle_group` and `created_at` columns that don't exist in the current schema. Safe for now because `allowAddNewRow` is disabled on that table.
- **`ClearMostData`** — this is a schema migration (alters a FK constraint), not a data wipe. It errors if run more than once and should be replaced with a straightforward `DELETE`.
- **`GetSessionExercises` previous_note** — fetches the most recent note for an exercise across all templates. If per-template note history is needed, add `AND s.template_id = te.template_id` to the subquery.
- **No null guard on SelectWorkout** — clicking Complete before selecting a workout inserts a session with `template_id = null`.
