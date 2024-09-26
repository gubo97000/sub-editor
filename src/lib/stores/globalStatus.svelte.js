
/**
 * @type {{time:number, transcriptionCorrections:[],translationCorrections:[], selectedVideo:string}}
*/
let globState = $state({ time:0, selectedVideo:"", transcriptionCorrections: [], translationCorrections: [] });

export function getGlobState() {
   return {
       get globState() {
           return globState;
       },
       set globState(value) {
        globState = value;
       }
   };
}