import { globalStatus as gs } from '$lib/stores/globalStatus.svelte';
import { VTTToSrt } from '$lib/subs';
import type { TextTrackInit } from 'vidstack';

/**
 * Converts a cue point in seconds to a time string in the format "HH:MM:SS.sss".
 *
 * @param {number} cueDouble - The cue point in seconds with decimal.
 * @returns {string} The formatted time string.
 */
export const cueDoubleToTimeString = (cueDouble: number) => {
	return (
		new Date(cueDouble * 1000)
			.toISOString()
			.substr(11, 8)
			.replace(/^(00:)(?=\d{2}:)/, '') +
		'.' +
		cueDouble.toFixed(3).toString().split('.')[1]
	);
};

/**
 * Converts a time string in the format "HH?:MM?:SS.decimal" to a total number of seconds.
 *
 * @param {string} timeString - The time string to convert, in the format "HH?:MM?:SS.decimal".
 * @returns {number} The total number of seconds represented by the time string.
 */
export const timeStringToCueDouble = (timeString: string) => {
	const chunks = timeString.split('.')[0].split(':');
	if (chunks.length === 2) {
		chunks.unshift('00');
	}
	const [hours, minutes, seconds] = chunks.map((chunk) => parseInt(chunk, 10));
	return hours * 3600 + minutes * 60 + seconds + parseFloat(timeString.split('.')[1]) / 1000;
};

/**
 * Verifies if the application has the necessary permissions to access a file.
 *
 * @param {FileSystemFileHandle | FileSystemDirectoryHandle} fileHandle - The file handle to check
 *   permissions for.
 * @param {boolean} withWrite - If true, checks for read and write permissions; otherwise, checks
 *   for read-only permissions.
 * @returns {Promise<boolean>} - A promise that resolves to true if the required permissions are
 *   granted, otherwise false.
 */
export async function verifyPermission(
	fileHandle: FileSystemFileHandle | FileSystemDirectoryHandle,
	withWrite: boolean
) {
	const opts = {};
	if (withWrite) {
		opts.mode = 'readwrite';
	}

	// Check if we already have permission, if so, return true.
	if ((await fileHandle.queryPermission(opts)) === 'granted') {
		return true;
	}

	// Request permission to the file, if the user grants permission, return true.
	if ((await fileHandle.requestPermission(opts)) === 'granted') {
		return true;
	}

	// The user did not grant permission, return false.
	return false;
}

/**
 * Extracts the video ID from a Panopto URL pattern
 *
 * @param {string} url - URL string containing the video ID
 * @returns {string | null} The extracted ID or null if not found
 */
export function extractVideoId(url: string) {
	// Match everything between "/Download/" and ".mp4"
	const regex = /\/Download\/([^.]+)\.mp4/;
	const match = url.match(regex);
	return match ? match[1] : null;
}

export function insertTextPreservingUndo(
	textarea: {
		selectionStart: any;
		selectionEnd: any;
		dispatchEvent: (arg0: InputEvent) => void;
		value: string;
	},
	text: string | any[]
) {
	// Store current selection
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;

	// Create and dispatch a text input event
	const event = new InputEvent('input', {
		data: text,
		bubbles: true,
		cancelable: false
	});

	textarea.dispatchEvent(event);

	// If the event was canceled, fall back to manual insertion
	if (!event.defaultPrevented) {
		const beforeText = textarea.value.substring(0, start);
		const afterText = textarea.value.substring(end);
		textarea.value = beforeText + text + afterText;
		textarea.selectionStart = textarea.selectionEnd = start + text.length;
	}
}

/**
 * @param {import('vidstack').TextTrackInit} sub
 * @param {'txt' | 'srt'} format
 */
export const exportSub = (sub: TextTrackInit, format: 'srt' | 'txt' = 'srt') => {
	if (typeof sub.content !== 'object') return;
	if (!sub.content.cues) return;
	const data = sub?.content?.cues.map((cue) => {
		return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
	});
	switch (format) {
		case 'srt':
			const srt = VTTToSrt(data);
			const blob = new Blob([srt], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${gs.selectedVideo}.srt`;
			a.click();
			break;
		case 'txt':
			const txt = data
				.map((cue) => {
					return `${cue.text}`;
				})
				.join(' ');
			const blob2 = new Blob([txt], { type: 'text/plain' });
			const url2 = URL.createObjectURL(blob2);
			const a2 = document.createElement('a');
			a2.href = url2;
			a2.download = `${gs.selectedVideo}.txt`;
			a2.click();
			break;
		default:
			break;
	}
};

export const timeToCSSIdentifier = (n: number) => {
	return `_${n}`.replace('.', '-');
};

export const parseJwt=(token:string)=> {
		if (token == '') {
			return;
		}
		var base64Url = token.split('.')[1];
		var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		var jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map(function (c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join('')
		);
		console.log('jsonPayload', jsonPayload);
		return JSON.parse(jsonPayload);
	}

export const isExpired = (unixTime:number) => {
	return Date.now()/1000 < unixTime
}