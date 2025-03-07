<script>
	import { getSubState } from './stores/subState.svelte';

	/** @type {import('@langchain/core/messages').AIMessageChunk} */
	let response = $state();
	let fetching = $state(false);
	/** @type {{ chunkNumber: number }} */
	let { chunkNumber } = $props();

	const { subState } = getSubState();

	const clickHandler = async () => {
		fetching = true;
		const sub = subState.subs[0];

		if (typeof sub.content === 'object' && sub.content.cues) {
			const toSend = sub?.content.cues?.map((sub) => {
				return sub.text;
			});

			// Split `toSend` into chunks of 10
			const chunkSize = 10;
			const chunks = [];
			for (let i = 0; i < toSend.length; i += chunkSize) {
				chunks.push(toSend.slice(i, i + chunkSize));
			}

			// Fetch each chunk in parallel
			const promises = fetch('/api/translate', {
				method: 'POST',
				body: JSON.stringify(chunks[chunkNumber])
			}).then((res) => {
				return res.json();
			});

			// Await all promises and maintain order
			const results = await Promise.all([promises]);
			const prStatus = await Promise.allSettled([promises]);
			console.log(prStatus);
			// Extract the `kwargs` from each result and flatten them
			/** @type string[] */
			const response = results.flatMap((result, index) => {
				console.log(result.kwargs);
				if (prStatus[index].status !== 'fulfilled') {
					return Array(chunks[index].length).fill(`ServerErrorInChunk-${chunkNumber}`);
				}
				try {
					const res = JSON.parse(result.kwargs.content);
					if (chunks[index].length !== res.length) {
						return Array(chunks[index].length).fill(`LengthErrorInChunk-${chunkNumber}`);
					}
					return res;
				} catch (e) {
					return Array(chunks[index].length).fill(`ContentErrorInChunk-${chunkNumber}`);
				}
			});
			fetching = false;
			console.log(response);
			// sub.content.cues.forEach((cue, i) => {
			// 	cue.text = response[i];
			// });

			// Copy the original subState.subs[0] to subState.subs[1]
			if (!subState.subs[1]) {
				subState.subs[1] = JSON.parse(JSON.stringify(subState.subs[0])); //deep copy
			}
			subState.subs[1] = {
				...subState.subs[1],
				id: 'fi-FI',
				label: 'Finnish-Translated',
				language: 'fi-FI'
			};
			let copy = JSON.parse(JSON.stringify(subState.subs[1]));
			// if (!subState.subs[1]?.content?.cues) return;
			for (const [i, text] of response.entries()) {
				const cuePosition = i + chunkNumber * chunkSize; //Insert cue in correct position
				copy.content.cues[cuePosition].text = text;
			}
			subState.subs[1] = copy;
			// response.forEach((text, i) => {
			// 	const cuePosition = i + (chunkNumber * chunkSize);
			// 	console.log(i,cuePosition, chunkNumber * chunkSize, (chunkNumber + 1) * chunkSize);
			// 	// if (i < chunkNumber * chunkSize || i >= (chunkNumber + 1) * chunkSize) return;
			// 	subState.subs[1].content.cues[cuePosition].text = text;
			// });
		}
	};
</script>

<div>
	<button onclick={clickHandler}>
		{!fetching ? 'Translate chunk!' : `Loading`}
	</button>
	{#if response}
		{response.content}
	{/if}
</div>
