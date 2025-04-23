
/**
 * SubState holds the state of currently selected and displayed subtitles
 * @type {{video:File,subs: Record<string,import("vidstack").TextTrackInit>,  err: Record<string,{segments: {words:{score:number, word:string}[]}[] }>
 * } }
 */
let subState = $state({ subs: {}, err: {}, video: {} });

export function getSubState() {
	return {
		get subState() {
			console.log("subState get");
			return subState;
		},
		set subState(value) {
			console.log("subState check");
			subState = value;
		},
	};
}

class SubStateSaved {
	/** reactive saved subtitles */
	subs = $state({});
	/** reactive saved errors */
	err = $state({});

	/**
	 * Check if live subtitles at `index` (or all if null) match saved.
	 * If any mismatch, asks confirmation. Returns true if all saved
	 * or user confirms discard, false otherwise.
	 */
	areSubtitleChangesSaved(index = null) {
		const live = getSubState().subState.subs;
		const checkOne = (i) => {
			if (this.subs[i] === JSON.stringify(live[i])) return true;
			return confirm(
				`Changes made in “${live[i].label}” will be LOST. Is it OK?`
			);
		};

		if (index === null) {
			for (let i in live) {
				if (!checkOne(i)) return false;
			}
			return true;
		}
		return checkOne(index);
	}
}

export const subStateSaved = new SubStateSaved();