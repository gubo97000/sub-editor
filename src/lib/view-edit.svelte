<script>
	import CheckTrslZone from '$lib/llm-tabs/check-trsl-zone.svelte';
	import LlmZone from '$lib/llm-tabs/llm-zone.svelte';
	import Ltrsl from '$lib/ltrsl.svelte';
	import { globalStatus as gs } from '$lib/stores/globalStatus.svelte';
	import { getSubState } from '$lib/stores/subState.svelte';
	import SubZone from '$lib/sub-zone.svelte';
	import { getContext, onMount, setContext } from 'svelte';
	import 'vidstack/player';
	import 'vidstack/player/layouts/plyr';
	import 'vidstack/player/styles/base.css';
	import 'vidstack/player/styles/plyr/theme.css';
	import 'vidstack/player/ui';
	import AiHelperZone from './llm-tabs/ai-helper-zone.svelte';
	import CustomModelsZone from './llm-tabs/custom-models-zone.svelte';
	import TranslationOptions from './llm-tabs/translation-options.svelte';
	import TranscribeButton from './transcribeButton.svelte';

	// import type { MediaPlayerElement } from 'vidstack/elements';

	const { subState } = getSubState();
	/** @type {import('vidstack/elements').MediaPlayerElement?} } */
	let player = $state(null);

	/** @type {{ parsingErrors: { message: string }[] }} */
	let alerts = $state({ parsingErrors: [] });
	setContext('alerts', alerts);
	$inspect(alerts, '🚨 alerts');

	/** @type {FileList | null} */
	let files = $state(null);
	// /** @type {boolean} */
	// let correctSub = $state(false);
	// /** @type {boolean} */
	// let correctTranslateSub = $state(false);
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

	/** @type {{ videoLib: VideoLibrary }} */
	const context = getContext('videoLib');
	// videoLib = context?.videolib?.videoLib ?? {};
	// console.log('context', $state.snapshot(context.videoLib));
	// console.log('videoLib', context?.videoLib);

	$effect(() => {
		// console.log('context', context);
		// console.log('videoLib', context.videoLib);
		// console.log('videoLib uncontext', videoLib);
	});

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
			// console.log($state.snapshot(sub));
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
					subState.video = url;
					player.src = { src: url };
				}); //🔴
				// player.src = { src: videoLib[selectedVideo].video, type: 'video/object' };
			}
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
	<div style="position:sticky; top:0; display:flex; flex-direction: column; height:100%;">
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
				class={`tab-button ${showTab === 'customModels' && 'activeTab'}`}
				onclick={() => {
					showTab = 'customModels';
				}}
			>
				Custom Models Options
			</button>
			<button
				class={`tab-button ${showTab === 'translationOptions' && 'activeTab'}`}
				onclick={() => {
					showTab = 'translationOptions';
				}}
			>
				Translation Options
			</button>

			<button
				class={`tab-button ${showTab === 'customHelper' && 'activeTab'}`}
				onclick={() => {
					showTab = 'customHelper';
				}}
			>
				AI Helper
			</button>
			<button
				class={`tab-button ${showTab === 'transcriptionHelper' && 'activeTab'}`}
				onclick={() => {
					showTab = 'transcriptionHelper';
				}}
			>
				Transcription Helper
			</button>
			{#if subState.subs[1]}
				<button
					class={`tab-button ${showTab === 'translationHelper' && 'activeTab'}`}
					onclick={() => {
						showTab = 'translationHelper';
					}}
				>
					Translation Helper
				</button>
			{/if}

			<!-- <Ltrsl /> -->
		</div>
		<div class="activeTab" style="flex-grow: 1;">
			{#if showTab === 'customModels'}
				<CustomModelsZone />
			{/if}
			{#if showTab === 'translationOptions'}
				<TranslationOptions />
			{/if}
			{#if showTab === 'transcriptionHelper'}
				<LlmZone />
			{/if}
			{#if showTab === 'customHelper'}
				<AiHelperZone />
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
	.container {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		/* overflow:hidden; */
		height: 96vh;
		/* width: 300px; */
	}
	.active {
		background-color: var(--primary-color-active);
		height: 100%;
		overflow: scroll;
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
