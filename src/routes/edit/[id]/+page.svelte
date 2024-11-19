<script>
	import ApiTest from '$lib/api-test.svelte';
	import AuthButton from '$lib/auth.svelte';
	import CheckTrslZone from '$lib/check-trsl-zone.svelte';
	import LlmZone from '$lib/llm-zone.svelte';
	import Ltrsl from '$lib/ltrsl.svelte';
	import { getGlobState } from '$lib/stores/globalStatus.svelte.js';
	import { getSubState } from '$lib/stores/subState.svelte';
	import SubZone from '$lib/sub-zone.svelte';
	import { parseByteStream, parseResponse, parseText } from 'media-captions';
	import { onMount } from 'svelte';
	import { FullscreenButton, Time } from 'vidstack';
	import 'vidstack/player';
	import 'vidstack/player/layouts/plyr';
	import 'vidstack/player/styles/base.css';
	import 'vidstack/player/styles/plyr/theme.css';
	import 'vidstack/player/ui';

	//svelte get the slug named if

	const { subState } = getSubState();
	const { globState: gs } = getGlobState();

	const { data } = $props();
	console.log($state.snapshot(data));

	/** @type {import('vidstack/elements').MediaPlayerElement?} } */
	let player = $state(null);

	/** @type {FileList | null} */
	let files = $state(null);
	/** @type {FileList | null} */
	let subFiles = $state(null);
	/** @type {FileList | null} */
	let subErrorFiles = $state(null);
	/** @type {FileList | null} */
	let directory = $state(null);
	/** @type {boolean} */
	let correctSub = $state(false);
	/** @type {boolean} */
	let correctTranslateSub = $state(false);
	/** @type {'transcriptionHelper' | 'translationHelper'} */
	let showTab = $state('transcriptionHelper');

	let videoLib = $derived.by(() => {
		/**
		 * @type {Object<
		 * 	string,
		 * 	{
		 * 		video: File;
		 * 		subFile?: File;
		 * 		errorFile?: File;
		 * 		subFinFile?: File;
		 * 		subCorFile?: File;
		 * 		subCorFinFile?: File;
		 * 	}
		 * >}
		 */
		const videoLib = {};
		console.log(directory);
		if (directory) {
			//find video file
			for (const video of directory) {
				if (video.type.includes('video')) {
					videoLib[video.name.split('.').slice(0, -1).join()] = { video: video };
				}
			}
			for (const file of directory) {
				const fileName = file.name.split('.').slice(0, -1).join();
				if (file.webkitRelativePath.includes('/output/')) {
					// if (!videoLib[file.name.split('.').slice(0, -1).join()]) continue;
					if (file.type.includes('json')) {
						videoLib[fileName]['errorFile'] = file;
					}
					if (file.name.includes('.srt')) {
						videoLib[fileName]['subFile'] = file;
					}
				}
				if (file.webkitRelativePath.includes('/SubtitlesCorrected/')) {
					if (file.name.includes('.srt')) {
						videoLib[fileName]['subCorFile'] = file;
					}
				}
				if (file.webkitRelativePath.includes('/Translations/')) {
					// if (!videoLib[file.name.split('.').slice(0, -1).join()]) continue;
					if (file.name.includes('.srt')) {
						videoLib[fileName]['subFinFile'] = file;
					}
				}
				if (file.webkitRelativePath.includes('/TranslationsCorrected/')) {
					// if (!videoLib[file.name.split('.').slice(0, -1).join()]) continue;
					if (file.name.includes('.srt')) {
						videoLib[fileName]['subCorFinFile'] = file;
					}
				}
			}
		}
		console.log('videolib', videoLib);
		console.log(
			'loaded translations',
			Object.entries(videoLib).reduce((acc, [k, cur]) => acc + (cur?.subFinFile ? 1 : 0), 0)
		);
		return videoLib;
	});
	console.log(data);
	const updateSubs = () => {
		if (!player) return;
		console.log(subState.subs);
		Object.entries(subState.subs).forEach(([key, sub]) => {
			if (sub.content) {
				// console.log('sub', sub);
				// console.log(sub.content);
				sub.content.cues.forEach((cue) => {
					console.log(cue.text);
				});
				// console.log(sub.content.cues[0]);
				// console.log(sub.content.cues[0].text);
			}
		});
		let trackShowing =
			player.textTracks.toArray().find((track) => {
				return track.mode === 'showing';
			})?.id ?? 'en-US';
		player.textTracks.clear();
		for (const [_, sub] of Object.entries(subState.subs)) {
			console.log(sub);
			player.textTracks.add({ ...sub, default: sub.id === trackShowing });
		}

		if (player.paused) {
			player.currentTime += 0.01;
			setTimeout(() => {
				player.currentTime -= 0.01;
			}, 1);
		}
	};
	$effect(() => {
		updateSubs();
	});

	/** @param {number} time */
	const goToTime = (time) => {
		if (!player) return;
		player.currentTime = time;
	};

	// //On videoFile change
	$effect(() => {
		if (!player) return;
		if (files?.[0]) {
			player.src = { src: files?.[0], type: 'video/object' };
		}
		// console.log(files);
		// console.log(
		// 	files?.[0] ??
		// 		'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
		// );
		// console.log(player?.src);
		// console.log(player);
	});

	const setSubFile = (file) => {
		parseByteStream(file.stream(), { type: 'srt' }).then((res) => {
			const cont = {
				cues: res.cues.map((cue) => {
					return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
				})
			};
			subState.subs['en-US'] = {
				id: 'en-US',
				content: $state.snapshot(cont),
				label: `English-Loaded`,
				kind: 'captions',
				default: true,
				language: 'en-US',
				type: 'json'
			};
		});
	};
	const setFinSubFile = (file) => {
		parseByteStream(file.stream(), { type: 'srt' }).then((res) => {
			const cont = {
				cues: res.cues.map((cue) => {
					return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
				})
			};
			subState.subs['fi-FI'] = {
				id: 'fi-FI',
				content: $state.snapshot(cont),
				label: `Finnish-Translated`,
				kind: 'captions',
				default: true,
				language: 'fi-FI',
				type: 'json'
			};
		});
	};

	const setSubErrorFile = (file) => {
		file.text().then((res) => {
			subState.err['en-US'] = JSON.parse(res);
		});
	};

	//On subFile change
	$effect(() => {
		if (!player) return;
		if (subFiles?.[0]) {
			setSubFile(subFiles?.[0]);
		}
	});
	//On subErrorFile change
	$effect(() => {
		if (!player) return;
		if (subErrorFiles?.[0]) {
			subErrorFiles?.[0].text().then((res) => {
				subState.err['en-US'] = JSON.parse(res);
				// content = res;
			});
		}
	});

	//On gs.selectedVideo change
	$effect(() => {
		console.log(gs.selectedVideo);
		if (!player) return;
		if (gs.selectedVideo) {
			subState.subs = {};
			subState.err = {};
			if (videoLib[gs.selectedVideo].video)
				player.src = { src: videoLib[gs.selectedVideo].video, type: 'video/object' };

			if (correctSub && videoLib[gs.selectedVideo]?.subCorFile) {
				console.log(videoLib[gs.selectedVideo]?.subCorFile?.webkitRelativePath);
				setSubFile(videoLib[gs.selectedVideo].subCorFile);
			} else if (videoLib[gs.selectedVideo]?.subFile)
				setSubFile(videoLib[gs.selectedVideo].subFile);

			if (correctTranslateSub && videoLib[gs.selectedVideo]?.subCorFinFile)
				setFinSubFile(videoLib[gs.selectedVideo].subCorFinFile);
			else if (videoLib[gs.selectedVideo]?.subFinFile)
				setFinSubFile(videoLib[gs.selectedVideo].subFinFile);
			if (!correctSub)
				if (videoLib[gs.selectedVideo]?.errorFile)
					setSubErrorFile(videoLib[gs.selectedVideo].errorFile);
		}
	});

	onMount(() => {
		if (!player) return;
		/** You can add these tracks using HTML as well. */
		// for (const track of textTracks) player.textTracks.add(track);

		// Subscribe to state updates.
		return player.subscribe(({ paused, viewType, currentTime, textTracks }) => {
			gs.time = currentTime;
			// console.log('is audio view?', '->', viewType === 'audio');
			// console.log('textTracks', '->', textTracks);
			// console.log(JSON.stringify(textTracks[0]));
			// console.log(textTracks[0]);
			// console.log(res.data)
			// console.log('current time', '->', currentTime);
		});
		console.log(player?.src);
	});

	// fetch("/api/v1/proxy/"+data.sessionData.Urls.CaptionDownloadUrl.split("/Panopto/")[1]).then((res) => {
	fetch(data.sessionData.Urls.CaptionDownloadUrl, {
		credentials: 'include'
	}).then((res) => {
		res.text().then((text) => {
			if (!text) {
				console.error('no text');
				return;
			}
			parseText(text, { type: 'srt' }).then((res) => {
				const cont = {
					cues: res.cues.map((cue) => {
						return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
					})
				};
				subState.subs['en-US'] = {
					id: 'en-US',
					content: $state.snapshot(cont),
					label: `English-Loaded`,
					kind: 'captions',
					default: true,
					language: 'en-US',
					type: 'json'
				};
			});
		});
	});

	fetch(data.sessionData.Urls.DownloadUrl, {
		credentials: 'include'
	}).then((res) => {
		// res.text().then((text) => {
		// 	if (!text) {
		// 		console.error('no text');
		// 		return;
		// 	}
		// 	parseText(text, { type: 'srt' }).then((res) => {
		// 		const cont = {
		// 			cues: res.cues.map((cue) => {
		// 				return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
		// 			})
		// 		};
		// 		subState.subs['en-US'] = {
		// 			id: 'en-US',
		// 			content: $state.snapshot(cont),
		// 			label: `English-Loaded`,
		// 			kind: 'captions',
		// 			default: true,
		// 			language: 'en-US',
		// 			type: 'json'
		// 		};
		// 	});
		// });
	});
</script>

<div class="container">
	<!-- {#each subtitlesArray as subs}
		<SubtitleContainer title={subs.name} data={subs.data} />
	{/each} -->
	<!-- src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" -->
	<div style="position:sticky; top:0; height: 100vh; display:flex; flex-direction: column;">
		<media-player
			src={data.sessionData.Urls.DownloadUrl}
			bind:this={player}
			{...{
				// crossorigin: 'anonymous'
				// crossorigin: "use-credentials",
			}}
		>
			<media-provider>
				<!-- <track
					kind="captions"
					src={data.sessionData.Urls.CaptionDownloadUrl}
					srclang="en"
					label="English"
					default
				/> -->
			</media-provider>
			<media-plyr-layout></media-plyr-layout>
		</media-player>
		<br />
		<!-- <div>
			Legacy
			Video Upload
			<input type="file" bind:files />
			<div>
				Subs Upload
				<input type="file" bind:files={subFiles} accept=".srt" />
			</div>
			<div>
				Error Upload
				<input type="file" bind:files={subErrorFiles} accept=".json" />
			</div>
		</div> -->

		<div style="display:flex">
			<button
				class={`tab-button ${showTab === 'transcriptionHelper' && 'activeTab'}`}
				onclick={() => {
					showTab = 'transcriptionHelper';
				}}
			>
				Transcription Helper
			</button>
			{#if subState.subs['fi-FI']}
				<button
					class={`tab-button ${showTab === 'translationHelper' && 'activeTab'}`}
					onclick={() => {
						showTab = 'translationHelper';
					}}
				>
					Translation Helper
				</button>
			{/if}
			<Ltrsl />
		</div>
		<div class="activeTab" style="flex-grow: 1;">
			{#if showTab === 'transcriptionHelper'}
				<LlmZone />
			{/if}
			{#if showTab === 'translationHelper'}{/if}
			{#if showTab === 'translationHelper'}
				<CheckTrslZone />
			{/if}
		</div>
	</div>
	<SubZone {goToTime} />
</div>

<style>
	:global(body) {
		font-family: 'Roboto', sans-serif;
		font-size: 15px;
	}
	.container {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		/* width: 300px; */
	}
	.active {
		background-color: lightblue;
	}

	media-player {
		width: 600px;
		height: 400px;
	}
</style>
