export default {
  getOverlay(muscle) {

    const map = {
      "Abs": "abs-overlay.png",
      "Obliques": "obliques-overlay.png",
      "Chest": "chest-overlay.png",
      "Upper Chest": "upper_chest-overlay.png",
      "Biceps": "biceps-overlay.png",
      "Triceps": "triceps-overlay.png",
      "Forearms": "forearms-overlay.png",
      "Front Delts": "front_delts-overlay.png",
      "Side Delts": "side_delts-overlay.png",
      "Rear Delts": "rear_delts-overlay.png",
      "Traps": "traps-overlay.png",
      "Lats": "lats-overlay.png",
      "Upper Back": "upper_back-overlay.png",
      "Lower Back": "lower_back-overlay.png",
      "Glutes": "glutes-overlay.png",
      "Hamstrings": "hamstrings-overlay.png",
      "Quads": "quads-overlay.png",
      "Calves": "calves-overlay.png",
      "Neck": "neck-overlay.png",
			"Adductors": "adductors-overlay.png",
			"Hip Flexors": "hip_flexors-overlay.png"
    };

  const normalized = muscle
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
  url: "https://duffs.homene.st/fitness/fullbody/" + map[normalized]
};
},
	
getOverlaysForExercise() {

  if (!GetExerciseMuscles.data) {
    return [];
  }

  return GetExerciseMuscles.data
    .map(row => this.getOverlay(row.name))
    .filter(Boolean);

},
getOverlaysForWorkout() {

  if (!GetWorkoutMuscles.data) {
    return [];
  }

  return GetWorkoutMuscles.data
    .map(row => {

      const overlay = this.getOverlay(row.name);

      if (!overlay) return null;

      overlay.intensity = row.intensity;

      return overlay;

    })
    .filter(Boolean);

}
}

