<script>
	import ApiTest from '$lib/api-test.svelte';
	import AuthButton from '$lib/auth.svelte';
	import CheckTrslZone from '$lib/check-trsl-zone.svelte';
	import LlmZone from '$lib/llm-zone.svelte';
	import Ltrsl from '$lib/ltrsl.svelte';
	import { globalStatus as gs } from '$lib/stores/globalStatus.svelte';
	import { getSubState } from '$lib/stores/subState.svelte';
	import SubZone from '$lib/sub-zone.svelte';
	import { verifyPermission } from '$lib/utility.js';
	import { directoryOpen, fileOpen, fileSave, supported } from 'browser-fs-access';
	import { get, set } from 'idb-keyval';
	import { ChatConversationalAgentOutputParser } from 'langchain/agents';
	import { load } from 'langchain/load';
	import { parseByteStream, parseText } from 'media-captions';
	import { getContext, hasContext, onMount } from 'svelte';
	import { parse } from 'svelte/compiler';
	import { FullscreenButton, Time } from 'vidstack';
	import 'vidstack/player';
	import 'vidstack/player/layouts/plyr';
	import 'vidstack/player/styles/base.css';
	import 'vidstack/player/styles/plyr/theme.css';
	import 'vidstack/player/ui';

	// import type { MediaPlayerElement } from 'vidstack/elements';

	const { subState } = getSubState();
	/** @type {import('vidstack/elements').MediaPlayerElement?} } */
	let player = $state(null);

	/** @type {{ parsingErrors: { message: string }[] }} */
	let alerts = $state({ parsingErrors: [] });

	/** @type {FileList | null} */
	let files = $state(null);
	/** @type {boolean} */
	let correctSub = $state(false);
	/** @type {boolean} */
	let correctTranslateSub = $state(false);
	/** @type {'transcriptionHelper' | 'translationHelper'} */
	let showTab = $state('transcriptionHelper');

	/**
	 * Represents a single video entry with associated files.
	 *
	 * @typedef {Object} VideoFile
	 * @property {File} video - The main video file.
	 * @property {File} subFile - The subtitle file associated with the video (e.g., original
	 *   subtitles).
	 * @property {File} errorFile - The file containing parsing or error information.
	 * @property {File} subCorFile - The corrected subtitle file.
	 * @property {File} subFinFile - The translated subtitle file.
	 * @property {File} subCorFinFile - The corrected translated subtitle file.
	 */

	/**
	 * Represents the temporary video library used during folder scanning or processing.
	 *
	 * @typedef {Object<string, Partial<VideoFile>>} VideoLibrary
	 */

	/** @type {VideoLibrary} */
	// let videoLib = $state({});

	// const { data } = getEditContext();
	// const { data } = $props();
	// console.log($state.snapshot(data));
	// console.log(data);
	// if (data?.videoLib) {
	// 	videoLib = data?.videoLib;
	// }
	if (hasContext('videoLib')) {
	}
	const context = getContext('videoLib');
	// videoLib = context?.videolib?.videoLib ?? {};
	console.log('context', $state.snapshot(context.videoLib));
	console.log('videoLib', context?.videoLib);
	// const videoLib = (()=>context.videoLib)();
	$effect(() => {
		console.log('context', context);
		console.log('videoLib', context.videoLib);
		// console.log('videoLib uncontext', videoLib);
	});

	// $effect(() => {
	// 	if (context?.videolib) {
	// 		console.log('context', context);
	// 		videoLib = $state.snapshot(context.videolib);
	// 	}
	// });

	// $effect(() => {
	// 	if (Object.keys(videoLib).length === 0) {
	// 		console.log('no videoLib');
	// 		return;
	// 	}

	// });
	$inspect(context);

	const u = getContext('utils');
	//
	const value = getContext('value');
	$effect(() => {
		// console.log('value', value);
		// console.log('value', value?.counter);
	});

	const updateSubs = () => {
		if (!player) return;
		// console.log(subState.subs);
		Object.entries(subState.subs).forEach(([key, sub]) => {
			if (sub.content) {
				// console.log('sub', sub);
				// console.log(sub.content);
				// sub.content.cues.forEach((cue) => {
				// 	console.log(cue.text);
				// });
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
			console.log($state.snapshot(sub));
			player.textTracks.add({ ...sub, default: sub.id === trackShowing });
		}

		if (player.paused) {
			player.currentTime += 0.01;
			setTimeout(() => {
				if (!player) return;
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
		player.currentTime = time + 0.01;
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

	/** @param {File} file */
	const setSubFile = (file) => {
		subtitleParser(file).then((res) => {
			if (res) {
				subState.subs['en-US'] = {
					content: res,
					id: 'en-US',
					label: `English-Loaded`,
					kind: 'captions',
					default: true
				};
			}
		});
	};

	/** @param {File} file */
	const setFinSubFile = (file) => {
		subtitleParser(file).then((res) => {
			if (res) {
				subState.subs['fi-FI'] = {
					content: res,
					id: 'fi-FI',
					label: `Finnish-Loaded`,
					kind: 'captions',
					default: false
				};
			}
		});
	};

	/**
	 * Add Text Track to the state, needs a template for information and options
	 *
	 * @param {File | string} file
	 */

	const subtitleParser = async (file) => {
		const isString = typeof file === 'string';
		try {
			const res = await (isString
				? parseText(file, { type: 'srt', strict: true })
				: parseByteStream(file.stream(), { type: 'srt', errors: true, strict: true }));
			if (!res) return;
			return {
				cues: res.cues.map((cue) => ({
					text: cue.text,
					startTime: cue.startTime,
					endTime: cue.endTime
				}))
			};
		} catch (error) {
			try {
				await (isString
					? parseText(file, {
							type: 'srt',
							errors: true,
							onError: (e) => console.error(e)
						})
					: parseByteStream(file.stream(), {
							type: 'srt',
							errors: true,
							onError: (e) => console.error(e)
						}));

				console.log('trying alternative method');
				const textContent = isString ? file : await file.text();
				const fixedText = textContent
					.replace(/(\d{2}:\d{2}:\d{2},\d{1,3})(\d*)/g, (_, p1) => p1)
					.replace(/(\d{2}:\d{2}:\d{2},)undefined/g, (_, p1) => p1 + '000');
				const resAlt = await parseText(fixedText, {
					type: 'srt',
					errors: true,
					onError: (e) => console.error(e)
				});
				if (!resAlt) return;
				alerts.parsingErrors.push({
					message: `${isString ? '' : file.name} - Problems during parsing, please check for missing cues. If everything is ok, Export and override the file (the bug might have been fixed)`
				});
				return {
					cues: resAlt.cues.map((cue) => ({
						text: cue.text,
						startTime: cue.startTime,
						endTime: cue.endTime
					}))
				};
			} catch (e) {
				console.error(e);
			}
		}
	};

	/** @param {File} file */
	const setSubErrorFile = (file) => {
		file.text().then((res) => {
			subState.err['en-US'] = JSON.parse(res);
		});
	};

	//On gs.selectedVideo change
	$effect(() => {
		console.log(gs.selectedVideo);
		if (!player) return;
		if (!context.videoLib[gs.selectedVideo]) return;
		if (gs.selectedVideo) {
			const selectedVideo = gs.selectedVideo;
			alerts.parsingErrors = [];
			subState.subs = {};
			subState.err = {};
			if (context.videoLib[selectedVideo].video) {
				u.loadVideoEntry(gs.selectedVideo).then((url) => {
					player.src = { src: url };
				}); //🔴
				// player.src = { src: videoLib[selectedVideo].video, type: 'video/object' };
			}

			u.loadSubtitles(selectedVideo).then((subs) => {
				console.log(subs);
				subs.map((subtitle) => {
					subtitleParser(subtitle.text).then((content) => {
						console.log(content);
						if (content) {
							subState.subs[subtitle.id] = {
								content: content,
								id: subtitle.id,
								label: subtitle.language,
								kind: 'captions',
								default: true,
								language: subtitle.id,
								type: 'json'
							};
						}
					});
				});
			});

			// if (correctSub && context.videoLib[selectedVideo]?.subCorFile !== undefined) {
			// 	console.log(context.videoLib[selectedVideo]?.subCorFile?.webkitRelativePath);
			// 	setSubFile(context.videoLib[selectedVideo].subCorFile);
			// } else if (context.videoLib[selectedVideo]?.subFile)
			// 	setSubFile(context.videoLib[selectedVideo].subFile);

			// if (correctTranslateSub && context.videoLib[selectedVideo]?.subCorFinFile)
			// 	setFinSubFile(context.videoLib[selectedVideo].subCorFinFile);
			// else if (context.videoLib[selectedVideo]?.subFinFile)
			// 	setFinSubFile(context.videoLib[selectedVideo].subFinFile);
			// if (!correctSub)
			// 	if (context.videoLib[selectedVideo]?.errorFile)
			// 		setSubErrorFile(context.videoLib[selectedVideo].errorFile);
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
			// console.log(gs.time)
		});
		console.log(player?.src);
	});
</script>

<div class="container">
	<div style="position:sticky; top:0; height: 100vh; display:flex; flex-direction: column;">
		<select bind:value={gs.selectedVideo}>
			{#each Object.entries(context.videoLib).sort((a, b) => {
				return a[1].video.name.localeCompare( b[1].video.name, undefined, { numeric: true, sensitivity: 'base' } );
			}) as [key, video]}
				<option value={key}
					>{(video.subFile ? (video.subFinFile ? '' : '🇫🇮') : '🔴') +
						(video?.video?.name ?? key)}</option
				>
			{/each}
		</select>
		{#each alerts.parsingErrors as error}
			<div class="alert">{error.message}</div>
		{/each}
		<media-player bind:this={player}>
			<media-provider> </media-provider>
			<media-plyr-layout></media-plyr-layout>
		</media-player>
		<!-- <details open={!subState.subs?.["en-US"]}> -->

		<br />

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
	.alert {
		background-color: rgba(255, 0, 0, 0.221);
		color: red;
		padding: 4px;
		border-radius: 8px;
		margin: 4px;
	}
</style>
