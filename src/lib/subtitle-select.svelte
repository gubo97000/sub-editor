<script lang="ts">
	import { globalStatus as gs } from '$lib/stores/globalStatus.svelte';
	import { getContext } from 'svelte';
	import { subState } from './stores/subState.svelte';
	import { subtitleParser } from './subs';
	import type { AlertsContext, VideoLibContext, } from './types';

	// /** @type {{ videoLib: VideoLibrary }} */
	// const c = getContext<{ videoLib: VideoLibrary }>('videoLib');
	const u = getContext<VideoLibContext>('utils');

	const a = getContext<AlertsContext>('alerts');

	const { autoLoad = [], index } = $props();

	let subtitles = $state<Awaited<ReturnType<VideoLibContext['loadSubtitles']>>>([]);
	let value = $state('');
	$inspect(value, '✅ value');

	//On selected video change
	$effect(() => {
		console.log(gs?.selectedVideo);
		subtitles = [];
		u.loadSubtitles(gs?.selectedVideo).then((subs) => {
			subtitles = subs;
			onUpdatedSubtitleList();
		});
	});

	const onUpdatedSubtitleList = () => {
		console.log('Updated subtitle list');
		if (autoLoad) {
			for (let loadId of autoLoad) {
				for (let i in subtitles) {
					console.log(subtitles[i], 'test');
					if (subtitles[i].id === loadId) {
						value = subtitles[i].id ?? '';
						return;
					}
				}
				if (loadId === 'auto') {
					// value = $state.snapshot(notSelectedSubtitles)?.[0]?.id;
					value = subtitles?.[index].id ?? '';
				}
			}
		}
	};

	$effect(() => {
		console.log(value, subtitles);
		if (!value && !subtitles) return;
		handleSelect({ target: { value: value } });
	});

	const handleSelect = (e: { target: { value: string } }) => {
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
		let subtitle = subtitles.find((s) => s.id === e.target.value);
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
				subState.resetSavedState(index);
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
			if (subState.confirmDiscard(index)) {
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
		<option value="_translate">New Subtitle</option>
	{/if}
</select>
