/**
 * SubState holds the state of currently selected/displayed subtitles and a saved snapshot for
 * change‐tracking. Not saved in localStorage.
 */
export class SubState {
	/** Video File */
	video = $state({});

	// /** Raw live subtitles */
	// rawSubs = $state({});

	/** Raw live errors */
	err = $state({});

	/** JSON‐stringified saved subtitles */
	/** @type {Record<string, string>} */
	savedSubs = {};

	/** JSON‐stringified saved errors */
	savedErr = {};

	/** @type {Record<string, import('vidstack').TextTrackInit & {content: import('vidstack').VTTContent &{cues:import('vidstack').VTTCueInit[]}}>} */
	subs = $state({});

	constructor() {
		$effect.root(() => {
		$inspect.trace('SubState');
		console.log(this.subs,"🇫🇮")
		this.subs;
		});
	}

	/** Snapshot current live subtitles into savedSubs. If index === null, saves all. */
	resetSavedState = (index = null) => {
		if (index === null) {
			for (const key in this.subs) {
				this.savedSubs[key] = JSON.stringify(this.subs[key]);
			}
		} else {
			this.savedSubs[index] = JSON.stringify(this.subs[index]);
		}
		this.subs = { ...this.subs }; // Updates all listeners of subs
	}

	/** Check the checkpoints and return if the subtitle has been saved if empty check all*/
	isSaved = $state((index = null) => {
		if (index === null) {
			for (const key in this.subs) {
				if (this.savedSubs[key] !== JSON.stringify(this.subs[key])) return false;
			}
			return true;
		}
		return this.savedSubs[index] === JSON.stringify(this.subs[index]);
	})


	/** Returns true if saved or user confirms discard. */
	confirmDiscard = (index = null) => {
		/**
		 * Checks if the current state of an item at index `i` matches its saved state.
		 * If not, prompts the user for confirmation before discarding changes.
		 *
		 * @param {string | number} i - The index of the item to check.
		 * @returns {boolean} Returns true if the item is unchanged or the user confirms discarding changes; otherwise, false.
		 */
		const checkOne = (i) =>
			JSON.stringify(this.subs[i]) === this.savedSubs[i] ||
			confirm(`Changes made in “${this.subs[i].label}” will be LOST. Is it OK?`);

		if (index === null) {
			for (const key in this.subs) {
				if (!checkOne(key)) return false;
			}
			return true;
		}
		return checkOne(index);
	}

	reset = () => {
		// this.video = {};
		this.err = {};
		this.savedSubs = {};
		this.savedErr = {};
		this.subs = {};
	}
}

export const subState = new SubState();
