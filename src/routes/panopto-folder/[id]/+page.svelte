<script>
	import { authedFetch } from '$lib/apiWrapper.js';
	import { panoptoAuth as pA } from '$lib/stores/globalStatus.svelte';
	import {
		PANOPTO_LANGUAGE_CODES,
		PANOPTO_LANGUAGE_CODES_REDUCED,
		PANOPTO_LANGUAGE_CODES_TO_ID,
		VTTToSrt
	} from '$lib/subs.js';
	import { extractVideoId } from '$lib/utility.js';
	import ViewEdit from '$lib/view-edit.svelte';
	import { Popover } from 'bits-ui';
	import { set } from 'idb-keyval';
	import { setContext } from 'svelte';

	let popoverOpen = $state(false);
	let popoverAnchor = $state();
	let selectedLanguage = $state('');

	const { data } = $props();
	console.log($state.snapshot(data));
	console.log(data);

	const loadVideoEntry = async (/** @type {string} */ id) => {
		// "https://aalto.cloud.panopto.eu/Panopto/Podcast/Download/ba16432b-aa6d-4a84-abbc-b274007767ef.mp4?mediaTargetType=videoPodcast"
		// return `/api/v1/proxy/Podcast/Download/${id}.mp4?mediaTargetType=videoPodcast`;
		return `/api/v1/proxy/Podcast/Download/${id}.mp4?mediaTargetType=videoPodcast`;
	};

	const getVideoEntrySync = (/** @type {string} */ id) => {
		return `/api/v1/proxy/Podcast/Download/${id}.mp4?mediaTargetType=videoPodcast`;
	};

	const loadSubtitles = async (/** @type {string} */ id) => {
		// https://aalto.cloud.panopto.eu/Panopto/Pages/Viewer/DeliveryInfo.aspx
		// POST with this form data: deliveryId=0a9d6bf7-d7b6-4383-9bad-b1d10084d451&isLiveNotes=false&refreshAuthCookie=false&isActiveBroadcast=false&isEditing=false&isKollectiveAgentInstalled=false&isEmbed=true&responseType=json
		const availableLanguages = await authedFetch(`/api/v1/proxy/Pages/Viewer/DeliveryInfo.aspx`, {
			method: 'POST',
			headers: {
				// 'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				deliveryId: id,
				isLiveNotes: 'false',
				refreshAuthCookie: 'false',
				isActiveBroadcast: 'false',
				isEditing: 'false',
				isKollectiveAgentInstalled: 'false',
				isEmbed: 'true',
				responseType: 'json'
			})
		})
			.then((res) => res.json())
			.then((data) => {
				return data.Delivery.AvailableLanguages;
			});

		// "https://aalto.cloud.panopto.eu/Panopto/Pages/Transcription/GenerateSRT.ashx?id=ba16432b-aa6d-4a84-abbc-b274007767ef&language=English_GBR"
		const subsPromises = availableLanguages.map((languageIndex) => {
			const languageLabel = PANOPTO_LANGUAGE_CODES[languageIndex];
			return authedFetch(
				`/api/v1/proxy/Pages/Transcription/GenerateSRT.ashx?id=${id}&language=${languageLabel}`
			)
				.then((res) => res.text())
				.then((text) => {
					return {
						text: text,
						id: PANOPTO_LANGUAGE_CODES_TO_ID[languageLabel],
						language: languageLabel
					};
				});
		});
		return (await Promise.all(subsPromises)).filter((subs) => subs?.text !== '');
	};

	const saveSubtitle = async (subToSave, video, element = undefined) => {
		if (!PANOPTO_LANGUAGE_CODES.includes(subToSave.label)) {
			// Open the save subtitle modal
			popoverAnchor = element;
			popoverOpen = true;
			// Await the popover closing by returning a Promise.
			return;
		}
		const videoName = extractVideoId(video);
		const language = subToSave.label;
		// const language = 'Italian';
		let srt = VTTToSrt(
			subToSave?.content?.cues.map((cue) => {
				return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
			})
		);
		let blob = new Blob([srt], { type: 'text/plain' });
		console.log(subToSave, video);

		await fetch(`/api/v1/proxy/api/v1/sessions/${videoName}/captions/languages/${language}`, {
			method: 'DELETE',
			headers: {
				Authorization: 'Bearer ' + pA.value?.accessToken
			}
		}).then(() => {
			const formData = new FormData();
			formData.append('language', language);
			formData.append('', new File([blob], 'sub-editor.srt', { type: 'text/plain' }));
			fetch(`/api/v1/proxy/api/v1/sessions/${videoName}/captions`, {
				method: 'POST',
				headers: {
					Authorization: 'Bearer ' + pA.value?.accessToken
				},
				body: formData
			});
		});
		return true;
	};
	
	if (data?.videoLib) {
		const videoLib = data?.videoLib;
		setContext('videoLib', { videoLib });
		setContext('utils', {
			saveSubtitle,
			loadVideoEntry,
			loadSubtitles,
			getVideoEntrySync
		});
	}
</script>

<ViewEdit />

<Popover.Root bind:open={popoverOpen}>
	<Popover.Trigger />
	<Popover.Content customAnchor={popoverAnchor} interactOutsideBehavior="close" >
	<p style="width:200px">
		Use "Save in Panopto" for first save
	</p>
		<!-- <div>
			Language of subtitle
			<select bind:value={selectedLanguage}>
				{#each PANOPTO_LANGUAGE_CODES as l}
					<option value={l}>
						{l}
					</option>
				{/each}
			</select>
		</div>
		<button onclick={popoverSaveHandle}> Save </button>
		<Popover.Close>Close</Popover.Close> -->
	</Popover.Content>
</Popover.Root>

<style>
	/* Base styles */
	:global([data-popover-content]) {
		background-color: rgba(121, 212, 116, 0.611);
		position: absolute;
		top: 10%;
		left: 50%;

		border-radius: 16px;

		backdrop-filter: blur(4px);

		padding: 12px;
	}
</style>
