<script>
	import { authedFetch } from '$lib/apiWrapper.js';
	import {
		PANOPTO_LANGUAGE_CODES,
		PANOPTO_LANGUAGE_CODES_REDUCED,
		PANOPTO_LANGUAGE_CODES_TO_ID
	} from '$lib/subs.js';
	import ViewEdit from '$lib/view-edit.svelte';
	import { set } from 'idb-keyval';
	import { setContext } from 'svelte';
	const { data } = $props();
	console.log($state.snapshot(data));
	console.log(data);

	const loadVideoEntry = async (/** @type {string} */ id) => {
		// "https://aalto.cloud.panopto.eu/Panopto/Podcast/Download/ba16432b-aa6d-4a84-abbc-b274007767ef.mp4?mediaTargetType=videoPodcast"
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

	if (data?.videoLib) {
		const videoLib = data?.videoLib;
		setContext('videoLib', {videoLib});
		setContext('utils', {
			loadVideoEntry,
			loadSubtitles,
			getVideoEntrySync
		});
	}
</script>

<ViewEdit />
