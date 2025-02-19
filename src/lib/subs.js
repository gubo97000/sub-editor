/**
 * @param { {startTime: string, endTime: string, speaker: string, text: string}[] } subtitles
 */
export const convertToSrt = (subtitles) => {
    return subtitles.map((sub, index) => {
        const id = index + 1;
        const startTime = sub.startTime.replace(',', '.');
        const endTime = sub.endTime.replace(',', '.');
        return `${id}\n${startTime} --> ${endTime}\n${sub.text}`;
    }).join('\n\n');
}

/**
 * @param { {    text: string,    startTime: number,    endTime: number}[] } subtitles
 */
//Convert from VTT to Srt format, start and end time are in seconds float (123.345) convert to 00:02:03,345
export const VTTToSrt = (subtitles) => {
    return subtitles.map((sub, index) => {
        const id = index + 1;

        /**
         * Converts a duration from seconds to a string formatted as "HH:MM:SS,mmm".
         *
         * @param {Number} d - The duration in seconds.
         * @returns {string} The formatted time string.
         */
        const secondsToHms = (d) => {
            const h = Math.floor(d / 3600);
            const m = Math.floor(d % 3600 / 60);
            const s = Math.floor(d % 3600 % 60);
            let ms = d.toString().split('.')?.[1] ?? "000";
            if (ms) {
                ms = ms.length > 3 ? ms.slice(0, 3) : ms.padEnd(3, '0');
            }
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${ms}`;
        }
        const startTime = secondsToHms(sub.startTime);
        const endTime = secondsToHms(sub.endTime);
        return `${id}\n${startTime} --> ${endTime}\n${sub.text}`;
    }).join('\n\n');
}



export const PANOPTO_LANGUAGE_CODES = [
    'English_USA',
    'English_GBR',
    'Spanish_MEX',
    'Spanish_ESP',
    'German',
    'French',
    'Dutch',
    'Thai',
    'Chinese_Simplified',
    'Chinese_Traditional',
    'Korean',
    'Japanese',
    'Russian',
    'Portuguese',
    'Polish',
    'English_AUS',
    'Danish',
    'Finnish',
    'Hungarian',
    'Norwegian',
    'Swedish',
    'Italian',
    'Welsh',
    'Catalan',
    'Galician',
    'Basque',
    'Arabic',
    'Hindi'
];

export const PANOPTO_LANGUAGE_CODES_REDUCED = [
    'English_USA',
    'English_GBR',
    'English_AUS',
    'Finnish',
]

// 🔴
export const PANOPTO_LANGUAGE_CODES_TO_ID = {
    'English_USA': 'en-US',
    'English_GBR': 'en-US',// 🔴
    'Spanish_MEX': 'es-MX',
    'Spanish_ESP': 'es-ES',
    'German': 'de-DE',
    'French': 'fr-FR',
    'Dutch': 'nl-NL',
    'Thai': 'th-TH',
    'Chinese_Simplified': 'zh-CN',
    'Chinese_Traditional': 'zh-TW',
    'Korean': 'ko-KR',
    'Japanese': 'ja-JP',
    'Russian': 'ru-RU',
    'Portuguese': 'pt-PT',
    'Polish': 'pl-PL',
    'English_AUS': 'en-AU',
    'Danish': 'da-DK',
    'Finnish': 'fi-FI',
    'Hungarian': 'hu-HU',
    'Norwegian': 'no-NO',
    'Swedish': 'sv-SE',
    'Italian': 'it-IT',
    'Welsh': 'cy-GB',
    'Catalan': 'ca-ES',
    'Galician': 'gl-ES',
    'Basque': 'eu-ES',
    'Arabic': 'ar-SA',
    'Hindi': 'hi-IN'
};






