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
 * A function to create a reactive state that is synchronized with localStorage.
 *
 * @param {string} key - The key under which the state is stored in localStorage.
 * @param {*} initialValue - The initial value to use if there is no value in localStorage.
 * @returns {*} The reactive state that is synchronized with localStorage.
 */
export function localStoreRune(key, initialValue) {
    // Initialize the rune with the default value or value from localStorage

    const state = $state(localStorage.getItem(key) ?
        JSON.parse(localStorage.getItem(key)) : initialValue
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

export const globalStatus = localStoreRune("globalStatus", { time: 0, selectedVideo: "", transcriptionCorrections: [], translationCorrections: [] });