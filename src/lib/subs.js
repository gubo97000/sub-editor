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