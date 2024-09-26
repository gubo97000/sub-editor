<script>
	import { getGlobState } from './stores/globalStatus.svelte.js';
	import { getSubState } from './stores/subState.svelte';

	// /** @type {import('@langchain/core/messages').AIMessageChunk} */
	let fixArray = $state();
	let buttonText = $state('');
	let fetchNum = $state(0);
	let fetchEndNum = $state(0);

	const { subState } = getSubState();
	const { globState: gs } = getGlobState();
	/**
	 * Handles a mouse event on a link.
	 *
	 * @param {MouseEvent & { target: HTMLAnchorElement }} event
	 */
	function scrollIntoView(event) {
		event.preventDefault();
		console.log(event?.target?.getAttribute('href'));
		const el = document.querySelector(event?.target?.getAttribute('href') ?? '');
		if (!el) return;
		el.scrollIntoView({
			behavior: 'smooth'
		});
		el.animate([{ backgroundColor: 'yellow' }, { backgroundColor: 'white' }], { duration: 1000 });
	}

	const clickHandler = async () => {
		fetchEndNum = 0;
		fetchNum = 0;
		const subEng = subState.subs['en-US'];
		const subFin = subState.subs['fi-FI'];
		if (!subFin) return;
		if (typeof subEng.content === 'object' && subEng.content.cues) {
			const toSend = subEng?.content.cues?.map((sub, index) => {
				return index + ' - English: ' + sub.text + ' - Finnish: ' + subFin.content.cues[index].text;
				// return sub.text;
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
				return fetch('/api/llm-trsl', {
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
			const responses = results.flatMap((result) => {
				console.log(result.kwargs.content);
				return result.kwargs.content.replaceAll('},\n]', '}]').replaceAll(`'}`, `'"}`); //Small fix for naziJSONparser
			});

			console.log(responses);
			//Concatenate arrays inside responses into a single array
			fixArray = responses.flatMap((res) => {
				try {
					res = JSON.parse(res);
				} catch (error) {
					console.log('Error parsing JSON', error);
					console.log('JSON:', res);
				}
				return res;
			});
			gs.translationCorrections = fixArray;
			// buttonText = responses.join(' ').replaceAll('_:_', 'a');
		}
	};
</script>

<div>
	<button onclick={clickHandler}>
		{fetchEndNum === fetchNum ? 'Get Hints!' : `Loading ${fetchEndNum}/${fetchNum}`}
	</button>
	<!-- {#if buttonText}
		{buttonText}
	{/if} -->
	{#if gs.translationCorrections.length > 0}
		<div >
			<table>
				<tbody>
					{#each gs.translationCorrections as res}
						<tr>
							<td>
								<button href={`#en${res.index}`} type="link" onclick={scrollIntoView}>
									{res.index}</button
								>
							</td>
							<td>
								<span class="error-string">{res.errorString}</span>
							</td>
							<td>
								<span style="">{res.correctionString}</span>
							</td>
							<td>
								<span style="">{res.note}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	td {
		padding: 4px 4px;
	}
	tr {
		border-bottom: 1px solid grey;
	}
	table {
		border-collapse: collapse;
		/* border-spacing: 0px; */
	}
	.error-string {
		--color: rgb(237, 147, 147);
		background-color: var(--color);
		/* border-radius: 4px; */
		/* border:1px solid black;  */
		padding: 1px 4px;
		-webkit-box-decoration-break: clone;
		/* box-shadow:
			-0.2em -0.1em 0 var(--color),
			-0.2em 0.1em 0 var(--color),
			0.5em -0.1em 0 var(--color),
			0.5em 0.1em 0 var(--color); */
		filter: url(#goo);
	}
</style>
