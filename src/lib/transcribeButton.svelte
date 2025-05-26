<script>
	import { PUBLIC_AALTO_SPEECH2TEXT_API_KEY } from '$env/static/public';
	import { FFmpeg } from '@ffmpeg/ffmpeg';
	import { fetchFile, toBlobURL } from '@ffmpeg/util';
	import { get } from 'idb-keyval';
	import JSON5 from 'json5';
	import JSZip from 'jszip';
	import { parse } from 'svelte/compiler';
	import { subState } from './stores/subState.svelte';
	import { subtitleParser, whisperX2Srt } from './subs';
	import { extractVideoId } from './utility';

	import ffmpegCoreJs from '$lib/assets/ffmpeg-wasm/ffmpeg-core.js?url';
	import ffmpegCoreWasm from '$lib/assets/ffmpeg-wasm/ffmpeg-core.wasm?url';

	/**
	 * Props for the TranscribeButton component.
	 *
	 * @typedef {Object} Props
	 * @property {string | File} [videoFile=''] - The video file to be transcribed. Default is `''`
	 */

	/** @type {Props} */
	const { videoFile = '' } = $props();

	let transcriptionId = $state('');
	let status = $state({ status: '', details: '' });
	let jobFile = $state(null);

	// const subState = getSubState().subState;

	// const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

	const videoName =
		typeof videoFile === 'string' ? (extractVideoId(videoFile) ?? 'panopto_video') : videoFile.name;
	const ffmpeg = new FFmpeg();

	let message = 'Click Start to Transcode';

	//// Video File Handling
	async function transcode(videoFile = '') {
		if (!ffmpeg.loaded) {
			await handleLoad();
		}

		message = 'Start extracting audio';
		console.log(ffmpeg.loaded);
		console.log(await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile)));
		const datain = await ffmpeg.readFile('input.mp4');
		// console.log(datain);
		await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'copy', 'out.mp4']);
		message = 'Complete transcoding';
		const data = await ffmpeg.readFile('out.mp4');
		console.log('Done');

		const formData = new FormData();
		formData.append('name', videoName);
		formData.append('language', 'en');
		formData.append('files', new File([data.buffer], 'out.mp4', { type: 'video/mp4' }));

		const res = await fetch('https://transcript.k8s.aalto.fi/transcription/transcribe', {
			method: 'POST',
			headers: {
				Authorization: 'Bearer ' + PUBLIC_AALTO_SPEECH2TEXT_API_KEY
			},
			body: formData
		});
		transcriptionId = (await res.text()).replaceAll('"', '');

		const intervalId = setInterval(async () => {
			const res = await fetch(
				`https://transcript.k8s.aalto.fi/transcription/status/${transcriptionId}`,
				{
					headers: {
						Authorization: 'Bearer ' + PUBLIC_AALTO_SPEECH2TEXT_API_KEY
					}
				}
			);
			status = await res.json();
			if (status.status === 'finished') {
				clearInterval(intervalId);
				let files = await getTranscription();
				parseFile(files[0].data);
			}
		}, 3000);
	}
	const handleLoad = async () => {
		console.log('starting load');
		// const ffmpeg = new FFmpeg();

		ffmpeg.on('log', ({ message: msg }) => {
			message = msg;
			console.log(message);
		});

		await ffmpeg.load({
			// coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
			// wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
			coreURL: ffmpegCoreJs,
			wasmURL: ffmpegCoreWasm
			// workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
		});
		console.log('done');
		return;
	};
	const getTranscription = async () => {
		const res = await fetch(
			`https://transcript.k8s.aalto.fi/transcription/download/${transcriptionId}`,
			{
				headers: {
					Authorization: 'Bearer ' + PUBLIC_AALTO_SPEECH2TEXT_API_KEY
				}
			}
		);
		let zipBlob = await res.blob();
		// Load the ZIP file using JSZip
		try {
			const zip = await JSZip.loadAsync(zipBlob);
			// Extract files from the ZIP
			const extractedFiles = [];
			for (const fileName of Object.keys(zip.files)) {
				const fileData = await zip.files[fileName].async('blob'); // Extract as Blob
				extractedFiles.push({ name: fileName, data: fileData });
			}

			console.log(extractedFiles); // Array of extracted files with names and data
			return extractedFiles;
		} catch (error) {
			console.error('Error extracting ZIP file:', error);
		}
	};

	//// Subtitle Save
	const handleFileLoad = async () => {
		console.log('file loaded');
		console.log(jobFile);
		parseFile(jobFile[0]);
	};

	/**
	 * Parse the file and save it to the state.
	 *
	 * @param {File} file - The file to be parsed.
	 */
	const parseFile = async (file) => {
		let content = JSON5.parse((await file.text()).replace(/(?<=:\s*)'|'(?=\s*([,}\]]))/g, '"'));
		let text = whisperX2Srt(content);
		subtitleParser(text).then((content) => {
			if (content) {
				subState.subs[0] = {
					content: content,
					id: 'Transcribed',
					label: 'English_transcribed',
					kind: 'captions',
					default: true,
					language: 'english',
					type: 'json'
				};
			}
		});
	};
	const handleClick = async () => {
		console.log('Transcribe!');
		status = { status: 'Extracting audio', details: '' };
		try {
			await transcode(videoFile);
		} catch (error) {
			status = { status: error, details: '' };
		}
	};
</script>

<!-- <button onclick={handleLoad}>Load</button> -->
<div>
	<p>Panopto throws a CORS error, you need to download a CORS-allow extension</p>
	<button onclick={handleClick}> Transcribe! </button>

	{status.status}
	{transcriptionId}
	<p>
		or drop here the file you obtained from <a
			href="https://transcript.k8s.aalto.fi/"
			target="_blank"
		>
			https://transcript.k8s.aalto.fi/
		</a>

		<input type="file" bind:files={jobFile} />
		{#if jobFile}
			<button onclick={handleFileLoad}>Load File</button>
		{/if}
	</p>
</div>
