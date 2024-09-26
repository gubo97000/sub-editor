<script>
	import { getSubState } from './stores/subState.svelte';

	/** @type {import('@langchain/core/messages').AIMessageChunk} */
	let response = $state();
	let fetchNum = $state(0);
	let fetchEndNum = $state(0);

	const { subState } = getSubState();

	const clickHandler = async () => {
        fetchEndNum = 0;
        fetchNum = 0;
		const sub = subState.subs['en-US'];

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
			const promises = [...chunks].map((chunk) => {
				console.log(chunk);
				fetchNum += 1;
				return fetch('/api/translate', {
					method: 'POST',
					body: JSON.stringify(chunk)
				}).then((res) => {
					fetchEndNum += 1;
					return res.json();
				});
			});

			// Await all promises and maintain order
			const results = await Promise.all(promises);
			console.log(results);
			// Extract the `kwargs` from each result and flatten them
			/** @type string[] */
			const response = results.flatMap((result) => {
				console.log(result.kwargs);
				return JSON.parse(result.kwargs.content);
			});

			console.log(response);
			// sub.content.cues.forEach((cue, i) => {
			// 	cue.text = response[i];
			// });

			// Copy the original subState.subs['en-US'] to subState.subs['fi-FI']
			subState.subs['fi-FI'] = JSON.parse(JSON.stringify(subState.subs['en-US']));
            subState.subs['fi-FI']= { ...subState.subs['fi-FI'], id: 'fi-FI', label: 'Finnish-Translated', language: 'fi-FI' };
			if (!subState.subs['fi-FI']?.content?.cues) return;
            response.forEach((text, i) => {
                subState.subs['fi-FI'].content.cues[i].text = text;
            });
			
		}
	};
</script>

<div>
	<button onclick={clickHandler}>
		{fetchEndNum === fetchNum ? 'Translate!' : `Loading ${fetchEndNum}/${fetchNum}`}
	</button>
	{#if response}
		{response.content}
	{/if}
</div>
