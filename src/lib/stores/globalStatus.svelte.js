// import { get } from "svelte/store";

import { LocalStorage } from "./storage.svelte";



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
 * @returns {T|undefined} The reactive state that is synchronized with localStorage.
 */
export function localStoreRune(key, initialValue) {
    if (typeof localStorage === 'undefined') return;
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
 * @template T
 * @param {string} key - The key under which the state is stored in localStorage.
 * @param {T} initialValue - The initial value to use if there is no value in localStorage.
 * @returns {T|undefined} The reactive state that is synchronized with localStorage.
 */
export function localStoreSyncRune(key, initialValue) {
    if (typeof localStorage === 'undefined') return;
    // Initialize the rune with the default value or value from localStorage
    const localStoredState = localStorage.getItem(key)
    let state = $state(localStoredState ?
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

    // Listen for changes to localStorage from other tabs
    window.addEventListener('storage', (event) => {
        console.log("👹 storage event", event)
        if (event.key === key) {
            if (event.newValue === null) {
                state = initialValue;
                console.log("👹 reset state")
            } else {
                state = JSON.parse(event.newValue);
                console.log("👹", state)
                console.log("👹", event.newValue)
            }
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
 * @property {string} transcriptionCorrectionsRaw - Raw transcription corrections.
 */

export const globalStatus = localStoreRune("globalStatus",  /** @type {GlobalStatus} */{ time: 0, selectedVideo: "", transcriptionCorrections: [],  transcriptionCorrectionsRaw:[],translationCorrections: [] });


// export const panoptoAuth = localStoreSyncRune("auth", { accessToken: "", refreshToken: "" }); 
export const panoptoAuth = new LocalStorage("auth", { accessToken: "", refreshToken: "" });

export const customLLMEndpoints = new LocalStorage("customLLMEndpoints", {
    endpoints: [{

        endpoint: '',
        model: '',
        apiKey: '',
        commands: '',
        chunkSize: undefined

    }]
})