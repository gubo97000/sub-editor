// import { get } from "svelte/store";



// export function getGlobState() {
//     /**
//  * @type {{time:number, transcriptionCorrections:[],translationCorrections:[], selectedVideo:string}}
// */
//     let globState = $state({ time: 0, selectedVideo: "", transcriptionCorrections: [], translationCorrections: [] });

//     const stored = localStorage.getItem('globalCache');

//     if (stored) {
//         globState = JSON.parse(stored);
//     }
//     return {
//         get globState() {
//             console.log('get globState', $state.snapshot(globState));
//             return globState;
//         },
//         set globState(value) {
//             console.log('set globState', globState);
//             // localStorage.setItem('globalCache', JSON.stringify(value));
//             globState = { ...value };
//         }
//     };
// }

// console.log('globalStatus', getGlobState().globState);
// let gs = getGlobState().globState;
// gs = { time: 0, selectedVideo: "", transcriptionCorrections: [], translationCorrections: [] };
// // getGlobState().globState = { time: 0, selectedVideo: "", transcriptionCorrections: [], translationCorrections: [] };





/**
 * @template T
 * @param {string} key - The key under which the state is stored in localStorage.
 * @param {T} initialValue - The initial value to use if there is no value in localStorage.
 * @returns {T} The reactive state that is synchronized with localStorage.
 */
export function localStoreRune(key, initialValue) {
    // Initialize the rune with the default value or value from localStorage
    const localStoredState = localStorage.getItem(key)
    const state = $state(localStoredState ?
        JSON.parse(localStoredState) : initialValue
    );

    // Effect to update localStorage whenever the rune's value changes
    $effect.root(() => {
        $effect(() => {
            // console.log("saving in local storage", state);
            localStorage.setItem(key, JSON.stringify(state));
        });
        return () => {
            console.log("cleaning executed in root effect")
        }
    });

    return state;
}

/**
 * A store that holds the global status of the application.
 * 
 * @constant {Object} globalStatus - The global status store.
 * @property {number} time - The current time in the application.
 * @property {string} selectedVideo - The currently selected video.
 * @property {Array} transcriptionCorrections - List of transcription corrections.
 * @property {Array} translationCorrections - List of translation corrections.
 */

export const globalStatus = localStoreRune("globalStatus",  /** @type {GlobalStatus} */{ time: 0, selectedVideo: "", transcriptionCorrections: [], translationCorrections: [] });