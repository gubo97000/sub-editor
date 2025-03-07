<script>
	import { PUBLIC_AALTO_SPEECH2TEXT_API_KEY } from '$env/static/public';
	import { FFmpeg } from '@ffmpeg/ffmpeg';
	import { fetchFile, toBlobURL } from '@ffmpeg/util';
	import { get } from 'idb-keyval';
	import JSZip from 'jszip';
	import { parse } from 'svelte/compiler';

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

	const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
	// /api/v1/proxy/Podcast/Download/${id}.mp4?mediaTargetType=videoPodcast
	const videoName =
		typeof videoFile === 'string' ? (videoFile.split('/')?.[5] ?? 'panopto_video') : videoFile.name;
	const ffmpeg = new FFmpeg();

	let message = 'Click Start to Transcode';

	async function transcode(videoFile = '') {
		if (!ffmpeg.loaded) {
			await handleLoad();
		}

		message = 'Start extracting audio';
		console.log(ffmpeg.loaded);
		console.log(await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile)));
		const datain = await ffmpeg.readFile('input.mp4');
		console.log(datain);
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

	const handleFileLoad = async () => {
		console.log('file loaded');
		console.log(jobFile);
	};
	const parseFile = async (file) => {};
	const handleClick = () => {
		console.log('Transcribe!');
		// SOME TETS FUNCTIONS FOR CORS PROBLEM WITH PANOPTO  CORS
		// fetch("https://transcript.k8s.aalto.fi/transcription/jobs_in_processing",{headers: {
		// 		Authorization: 'Bearer ' + PUBLIC_AALTO_SPEECH2TEXT_API_KEY
		// 	},})
		// fetch("https://download.cdn.cloud.panopto.eu/sessions/053bf10d-db8c-48ff-af40-b28500b984a0/d0351136-6238-455b-bb59-b28500b984a6-6762a3db-fe02-48c4-9661-b28901059476.mp4?response-content-disposition=attachment;filename=%22Course%20Information%20-%202025%20-%20English_default.mp4%22")
		transcode(videoFile);
	};
	const handleLoad = async () => {
		console.log('starting load');
		// const ffmpeg = new FFmpeg();
		message = 'Loading ffmpeg-core.js';
		ffmpeg.on('log', ({ message: msg }) => {
			message = msg;
			console.log(message);
		});
		await ffmpeg.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
			wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
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
</script>

<!-- <button onclick={handleLoad}>Load</button> -->

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
</p>
<input type="file" bind:files={jobFile} /> <button onclick={handleFileLoad}>Load File</button>
