export default {
	intervalId: null,

	start: (seconds) => {
		// Stop any existing timer first
		RestTimer.stop();

		// Set the end time in the store
		const endTime = Date.now() + (seconds * 1000);
		storeValue("restEndTime", endTime);
		storeValue("restRemaining", seconds);

		// Tick every second
		RestTimer.intervalId = setInterval(() => {
			const remaining = Math.max(0, Math.round((appsmith.store.restEndTime - Date.now()) / 1000));
			storeValue("restRemaining", remaining);
			if (remaining <= 0) {
				RestTimer.stop();
				showAlert("Rest done", "success");
			}
		}, 1000);
	},

	stop: () => {
		if (RestTimer.intervalId) {
			clearInterval(RestTimer.intervalId);
			RestTimer.intervalId = null;
		}
		storeValue("restEndTime", 0);
		storeValue("restRemaining", 0);
	}
}