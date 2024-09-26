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
//start and end time is in seconda format like 123.345 convert to 00:02:03,345
export const VTTToSrt = (subtitles) => {
    return subtitles.map((sub, index) => {
        const id = index + 1;
        const secondsToHms = (d) => {
            d = Number(d);
            var h = Math.floor(d / 3600);
            var m = Math.floor(d % 3600 / 60);
            var s = Math.floor(d % 3600 % 60);
            var ms = d.toString().split('.')[1];
            if (ms) {
                ms = ms.padEnd(3, '0');
            }
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${ms}`;
        }
        const startTime = secondsToHms(sub.startTime);
        const endTime = secondsToHms(sub.endTime);
        return `${id}\n${startTime} --> ${endTime}\n${sub.text}`;
    }).join('\n\n');
}