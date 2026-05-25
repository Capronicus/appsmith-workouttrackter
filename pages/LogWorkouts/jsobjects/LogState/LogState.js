export default {
  async toggle(id) {
    await storeValue('done_' + id, !this.isDone(id));
    await this.saveDraft();
  },

  isDone(id) {
    return appsmith.store['done_' + id] === true;
  },

  async clearStore() {
    const keysToCleanup = [];
    for (const key of Object.keys(appsmith.store)) {
      if (
        key.startsWith('reps_') ||
        key.startsWith('weight_') ||
        key.startsWith('feel_') ||
        key.startsWith('notes_') ||
        key.startsWith('done_') ||
        key.startsWith('inserting') ||
        key.startsWith('updating') ||
        key === 'workoutNotes' ||
        key === 'selectedWorkoutId' ||
        key === 'draftData'
      ) {
        keysToCleanup.push(key);
      }
    }
    for (const key of keysToCleanup) {
      await removeValue(key);
    }
    await resetWidget('InputWorkoutNotes', true);
  },

  async saveDraft() {
    const exercises = GetSessionExercises.data;
    if (!exercises || exercises.length === 0) return;

    const draftData = {
      workoutNotes: appsmith.store.workoutNotes ?? '',
      exercises: {}
    };

    for (const ex of exercises) {
      const teId = ex.template_exercise_id;
      const reps = {};
      for (let s = 1; s <= ex.default_sets; s++) {
        reps[s] = appsmith.store['reps_' + teId + '_' + s] ?? ex.default_reps;
      }
      draftData.exercises[teId] = {
        done: this.isDone(teId),
        weight: appsmith.store['weight_' + teId] ?? ex.default_weight,
        feel: appsmith.store['feel_' + teId] ?? 'same',
        notes: appsmith.store['notes_' + teId] ?? '',
        reps
      };
    }

    await storeValue('draftData', JSON.stringify(draftData));
    try {
      await SaveDraft.run();
    } catch (e) {
      // appsmith.store holds the draft as fallback if DB is unavailable
    }
  },

  async restoreDraft() {
    const row = LoadDraft.data?.[0];
    if (!row?.draft_data) return;

    const draft = typeof row.draft_data === 'string'
      ? JSON.parse(row.draft_data)
      : row.draft_data;

    if (draft.workoutNotes) {
      await storeValue('workoutNotes', draft.workoutNotes);
    }

    for (const [teIdStr, exData] of Object.entries(draft.exercises || {})) {
      const teId = Number(teIdStr);
      if (exData.done) await storeValue('done_' + teId, true);
      if (exData.weight != null) await storeValue('weight_' + teId, exData.weight);
      if (exData.feel) await storeValue('feel_' + teId, exData.feel);
      if (exData.notes != null) await storeValue('notes_' + teId, exData.notes);
      for (const [setNum, reps] of Object.entries(exData.reps || {})) {
        await storeValue('reps_' + teId + '_' + setNum, reps);
      }
    }
  },

  async complete() {
    const exercises = GetSessionExercises.data;
    const anyDone = exercises.some(ex => this.isDone(ex.template_exercise_id));
    if (!anyDone) {
      showAlert('Mark at least one exercise as done.', 'warning');
      return;
    }

    try {
      const sessionResult = await InsertSession.run();
      const sessionId = sessionResult[0].id;

      for (const ex of exercises) {
        if (!this.isDone(ex.template_exercise_id)) continue;

        const numSets = ex.default_sets;
        const teId = ex.template_exercise_id;

        const weight = appsmith.store['weight_' + teId] ?? ex.default_weight;
        const feel   = appsmith.store['feel_' + teId]   ?? 'same';
        const notes  = appsmith.store['notes_' + teId]  ?? '';

        for (let setNum = 1; setNum <= numSets; setNum++) {
          const reps = appsmith.store['reps_' + teId + '_' + setNum] ?? ex.default_reps;

          await storeValue('insertingSessionId', sessionId);
          await storeValue('insertingExerciseId', ex.exercise_id);
          await storeValue('insertingSetNum', setNum);
          await storeValue('insertingReps', reps);
          await storeValue('insertingWeight', weight);
          await storeValue('insertingFeel', feel);
          await storeValue('insertingNotes', notes);

          await InsertSessionSet.run();
        }

        const lastReps = appsmith.store['reps_' + teId + '_1'] ?? ex.default_reps;
        await storeValue('updatingTemplateExerciseId', teId);
        await storeValue('updatingWeight', weight);
        await storeValue('updatingReps', lastReps);
        await UpdateTemplateDefaults.run();
      }

      try { await DeleteDraft.run(); } catch (e) { /* ignore if no draft exists */ }
      await this.clearStore();
      showAlert('Workout logged!', 'success');
    } catch (e) {
      showAlert('Failed to log workout: ' + e.message, 'error');
    }
  }
}
