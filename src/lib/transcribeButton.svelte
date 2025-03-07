<script>
	import { PUBLIC_AALTO_SPEECH2TEXT_API_KEY } from '$env/static/public';
	import { FFmpeg } from '@ffmpeg/ffmpeg';
	import { fetchFile, toBlobURL } from '@ffmpeg/util';

	/**
	 * Props for the TranscribeButton component.
	 *
	 * @typedef {Object} Props
	 * @property {string | File} [videoFile=''] - The video file to be transcribed. Default is `''`
	 */

	/** @type {Props} */
	const { videoFile = '' } = $props();

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
		console.log(res);
	}

	const handleClick = () => {
		console.log('Transcribe!');
        fetch("https://download.cdn.cloud.panopto.eu/sessions/053bf10d-db8c-48ff-af40-b28500b984a0/d0351136-6238-455b-bb59-b28500b984a6-6762a3db-fe02-48c4-9661-b28901059476.mp4?response-content-disposition=attachment;filename=%22Course%20Information%20-%202025%20-%20English_default.mp4%22")
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
</script>

<!-- <button onclick={handleLoad}>Load</button> -->

<button onclick={handleClick}> Transcribe! </button>
