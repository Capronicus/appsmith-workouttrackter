export default {
  doneIds: [],
  
  toggle(id) {
    const idx = this.doneIds.indexOf(id);
    if (idx >= 0) {
      this.doneIds.splice(idx, 1);
    } else {
      this.doneIds.push(id);
    }
  },
  
  isDone(id) {
    return this.doneIds.includes(id);
  },
  
  reset() {
    this.doneIds = [];
  },
 async clearStore() {
  const keysToCleanup = [];

  for (const key of Object.keys(appsmith.store)) {
    if (
      key.startsWith('reps_') ||
      key.startsWith('weight_') ||
      key.startsWith('feel_') ||
      key.startsWith('notes_') ||
      key.startsWith('inserting') ||
      key.startsWith('updating')
    ) {
      keysToCleanup.push(key);
    }
  }

  for (const key of keysToCleanup) {
    await removeValue(key);
  }

  await resetWidget("InputWorkoutNotes", true);
}, 
 async complete() {
  if (this.doneIds.length === 0) {
    showAlert('Mark at least one exercise as done.', 'warning');
    return;
  }

  try {
    const sessionResult = await InsertSession.run();
    const sessionId = sessionResult[0].id;

    const exercises = GetSessionExercises.data;

    for (const ex of exercises) {
      if (!this.doneIds.includes(ex.template_exercise_id)) continue;

      const numSets = ex.default_sets;
      const teId = ex.template_exercise_id;

      const weight = appsmith.store[`weight_${teId}`] ?? ex.default_weight;
      const feel   = appsmith.store[`feel_${teId}`]   ?? 'same';
      const notes  = appsmith.store[`notes_${teId}`]  ?? '';

      for (let setNum = 1; setNum <= numSets; setNum++) {
        const reps = appsmith.store[`reps_${teId}_${setNum}`] ?? ex.default_reps;

        await storeValue('insertingSessionId', sessionId);
        await storeValue('insertingExerciseId', ex.exercise_id);
        await storeValue('insertingSetNum', setNum);
        await storeValue('insertingReps', reps);
        await storeValue('insertingWeight', weight);
        await storeValue('insertingFeel', feel);
        await storeValue('insertingNotes', notes);

        await InsertSessionSet.run();
      }

      const lastReps = appsmith.store[`reps_${teId}_1`] ?? ex.default_reps;
      await storeValue('updatingTemplateExerciseId', teId);
      await storeValue('updatingWeight', weight);
      await storeValue('updatingReps', lastReps);
      await UpdateTemplateDefaults.run();
    }

    await this.clearStore();
    showAlert('Workout logged!', 'success');
    this.reset();
  } catch (e) {
    showAlert('Failed to log workout: ' + e.message, 'error');
  }
}
}