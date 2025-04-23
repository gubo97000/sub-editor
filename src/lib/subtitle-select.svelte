<script>
	import { getContext } from 'svelte';

	import { globalStatus as gs } from '$lib/stores/globalStatus.svelte';
	import { getSubState, subStateSaved } from './stores/subState.svelte';
	import { subtitleParser } from './subs';

	/** @type {{ videoLib: VideoLibrary }} */
	const c = getContext('videoLib');
	const u = getContext('utils');

	const a = getContext('alerts');

	const { autoLoad = [], index } = $props();

	let subtitles = $state([]);
	let value = $state('');
	$inspect(value, '✅ value');
	// let value = $derived(autoLoad ? 0 : '');
	const subState = getSubState().subState;

	// const notSelectedSubtitles = $derived.by(
	//     ()=>{
	//         $inspect.trace();
	//         return subtitles?.filter((s) => {
	// 		return !Object.entries(subState.subs)
	// 			.map((s) => {
	// 				return s[1].id;
	// 			})
	// 			.includes(s.id);
	// 	})
	//     }
	// );
	// $inspect(notSelectedSubtitles);

	//On selected video change
	$effect(() => {
		console.log(gs?.selectedVideo);
		subtitles = [];
		u.loadSubtitles(gs?.selectedVideo).then((subs) => {
			subtitles = subs;
			onUpdatedSubtitleList();
		});
	});

	//On subtitles change, search ids for autoload
	// $effect(() => {
	//     // console.log(autoLoad);
	//     if (value) return;
	//     if (!subtitles) return;
	//     onUpdatedSubtitleList();
	// 	// if (autoLoad) {
	// 	// 	for (let loadId of autoLoad) {
	// 	// 		for (let sub of $state.snapshot(subtitles)) {
	//     //             // console.log(sub.id, loadId)
	// 	// 			if (sub.id === loadId) {
	// 	// 				value = sub.id;
	//     //                 return;
	// 	// 			}
	// 	// 		}
	//     //         if (loadId === "auto") {
	//     //             // value = $state.snapshot(notSelectedSubtitles)?.[0]?.id;
	//     //             value = $state.snapshot(subtitles)?.[0]?.id;
	//     //         }
	// 	// 	}
	// 	// }
	// });

	const onUpdatedSubtitleList = () => {
		console.log('Updated subtitle list');
		if (autoLoad) {
			for (let loadId of autoLoad) {
				for (let sub of $state.snapshot(subtitles)) {
					// console.log(sub.id, loadId)
					if (sub.id === loadId) {
						value = sub.id;
						return;
					}
				}
				if (loadId === 'auto') {
					// value = $state.snapshot(notSelectedSubtitles)?.[0]?.id;
					value = $state.snapshot(subtitles)?.[index]?.id;
				}
			}
		}
	};

	$effect(() => {
		console.log($state.snapshot(value), $state.snapshot(subtitles));
		if (!value && !subtitles) return;
		handleSelect({ target: { value: value } });
	});

	const handleSelect = (e) => {
		if (e.target.value === '_transcribe') {
			subState.subs[index] = {
				content: { cues: [] },
				id: '_transcribe',
				label: 'Transcribe',
				kind: 'captions',
				default: true
			};
		} else if (e.target.value === '_translate') {
			// Handle the new "Translate" option
			subState.subs[index] = {
				content: { cues: [] },
				id: '_translate',
				label: 'Translate',
				kind: 'captions',
				default: true
			};
		}
		let subtitle = $state.snapshot(subtitles.find((s) => s.id === e.target.value));
		if (!subtitle) return;
		console.log(e.target.value, subtitle);
		a['parsingErrors'] = [];
		subtitleParser(subtitle.text).then((content) => {
			if (content) {
				subState.subs[index] = {
					content: content,
					id: subtitle.id,
					label: subtitle.language,
					kind: 'captions',
					default: true,
					language: subtitle.id,
					type: 'json'
				};
				subStateSaved.subs[index] = JSON.stringify(subState.subs[index]);
				if ((content?.alerts?.length ?? 0) > 0) {
					a['parsingErrors'].push(...(content.alerts ?? []));
				}
			}
		});
	};
</script>

<select
	bind:value={
		() => value,
		(v) => {
			if (subStateSaved.areSubtitleChangesSaved(index)) {
				value = v;
				return;
			}
			return; //The value will not be changed
		}
	}
	onchange={(e) => {
		e.currentTarget.value = value; //This thing is necessary since bind doesn't reupdate
	}}
>
	{#each subtitles as sub, i}
		<option value={sub.id}>
			{sub.language}
		</option>
	{/each}
	{#if index === 0}
		<option value="_transcribe">Transcribe!</option>
	{/if}
	{#if index === 1}
		<option value="_translate">Translate!</option>
	{/if}
</select>
