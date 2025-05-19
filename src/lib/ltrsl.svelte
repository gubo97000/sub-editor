<script lang="ts">
	import { customLLMEndpoints as cLLME, localStoreRune } from '$lib/stores/globalStatus.svelte';
	import { sleep } from 'langchain/util/time';
	import { subState } from './stores/subState.svelte';

	let response = $state();
	let fetchNum = $state(0);
	let fetchEndNum = $state(0);

	// const { subState } = getSubState();

	let cps = localStoreRune<{
		commands: string;
		lastSelectedModel: string;
	}>('TranslationOptions', {
		commands: '',
		lastSelectedModel: ''
	})!;

	const clickHandler = async (customOptions: {
		model: typeof cLLME.value extends Record<any, infer V> ? V : never;
		commands?: string;
	}) => {
		fetchEndNum = 0;
		fetchNum = 0;
		const sub = subState.subs[0];

		if (typeof sub.content === 'object' && sub.content.cues) {
			const toSend = sub?.content.cues?.map((sub) => {
				return sub.text;
			});

			// Split `toSend` into chunks of 10
			const chunkSize = customOptions?.model.chunkSize ?? toSend.length;
			const chunks = [];
			for (let i = 0; i < toSend.length; i += chunkSize) {
				chunks.push(toSend.slice(i, i + chunkSize));
			}

			// Fetch each chunk in parallel
			const promises = [...chunks].map(async (chunk, index) => {
				console.log(chunk);
				fetchNum += 1;
				await sleep(index * 1000);
				const formData = new FormData();
				formData.append(
					'options',
					JSON.stringify({
						apiUrl: customOptions?.model.endpoint,
						model: customOptions?.model.model,
						apiKey: customOptions?.model.apiKey,
						// query: componentPreamble + '\n' + cps.commands + '\n' + customOptions.model.commands
					})
				);
				formData.append('data', JSON.stringify(chunk));
				return fetch('/api/translate', { method: 'POST', body: formData }).then((res) => {
					fetchEndNum += 1;
					return res.formData();
				});
			});

			// Await all promises and maintain order
			const results = await Promise.all(promises);
			const prStatus = await Promise.allSettled(promises);
			console.log(prStatus);
			// Extract the `kwargs` from each result and flatten them
			/** @type string[] */
			const response = results.flatMap((r, index) => {
				const result = JSON.parse(r.get('data'));
				console.log(result.kwargs);
				if (prStatus[index].status !== 'fulfilled') {
					return Array(chunks[index].length).fill(`ServerErrorInChunk-${index}`);
				}
				try {
					const res = JSON.parse(result.kwargs.content);
					if (chunks[index].length !== res.length) {
						return Array(chunks[index].length).fill(`LengthErrorInChunk-${index}`);
					}
					return res;
				} catch (e) {
					return Array(chunks[index].length).fill(`ContentErrorInChunk-${index}`);
				}
			});

			console.log(response);
			// sub.content.cues.forEach((cue, i) => {
			// 	cue.text = response[i];
			// });

			// Copy the original subState.subs[0] to subState.subs[1]
			subState.subs[1] = JSON.parse(JSON.stringify(subState.subs[0]));
			subState.subs[1] = {
				...subState.subs[1],
				id: 'fi-FI',
				label: 'Finnish-Translated',
				language: 'fi-FI'
			};
			if (!subState.subs[1]?.content?.cues) return;
			response.forEach((text, i) => {
				subState.subs[1].content.cues[i].text = text;
			});
		}
	};
</script>

<div>
	<button
		onclick={() => {
			clickHandler({ model: cLLME.value[cps.lastSelectedModel] });
		}}
		disabled={fetchEndNum !== fetchNum}
	>
		{fetchEndNum === fetchNum ? 'Translate!' : `Loading ${fetchEndNum}/${fetchNum}`}
	</button>
	{#if response}
		{response.content}
	{/if}
</div>
