
/**
 * SubState holds the state of currently selected and displayed subtitles
 * @type {{video:File,subs: Record<string,import("vidstack").TextTrackInit>,  err: Record<string,{segments: {words:{score:number, word:string}[]}[] }>
 * } }
 */
let subState = $state({ subs: {}, err: {}, video: {} });

export function getSubState() {
	return {
		get subState() {
			return subState;
		},
		set subState(value) {
			subState = value;
		}
	};
}