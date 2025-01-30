/**
 * Converts a cue point in seconds to a time string in the format "HH:MM:SS.sss".
 *
 * @param {number} cueDouble - The cue point in seconds with decimal.
 * @returns {string} The formatted time string.
 */
export const cueDoubleToTimeString = (cueDouble) => {
   return new Date(cueDouble * 1000)
        .toISOString()
        .substr(11, 8)
        .replace(/^(00:)(?=\d{2}:)/, '') +
        '.' +
        cueDouble.toFixed(3).toString().split('.')[1]
}


/**
 * Converts a time string in the format "HH?:MM?:SS.decimal" to a total number of seconds.
 *
 * @param {string} timeString - The time string to convert, in the format "HH?:MM?:SS.decimal".
 * @returns {number} The total number of seconds represented by the time string.
 */
export const timeStringToCueDouble = (timeString) => {
    const chunks= timeString.split(".")[0].split(':')
    if (chunks.length === 2) {
        chunks.unshift("00");
    }
    const [hours, minutes, seconds] = chunks.map(chunk => parseInt(chunk, 10));
    return hours * 3600 + minutes * 60 + seconds + parseFloat(timeString.split('.')[1]) / 1000;
}

/**
 * Verifies if the application has the necessary permissions to access a file.
 *
 * @param {FileSystemFileHandle| FileSystemDirectoryHandle} fileHandle - The file handle to check permissions for.
 * @param {boolean} withWrite - If true, checks for read and write permissions; otherwise, checks for read-only permissions.
 * @returns {Promise<boolean>} - A promise that resolves to true if the required permissions are granted, otherwise false.
 */
export async function verifyPermission(fileHandle, withWrite) {
    const opts = {};
    if (withWrite) {
      opts.mode = "readwrite";
    }
  
    // Check if we already have permission, if so, return true.
    if ((await fileHandle.queryPermission(opts)) === "granted") {
      return true;
    }
  
    // Request permission to the file, if the user grants permission, return true.
    if ((await fileHandle.requestPermission(opts)) === "granted") {
      return true;
    }
  
    // The user did not grant permission, return false.
    return false;
  }