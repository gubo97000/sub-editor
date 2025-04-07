<script>
	import { sleep } from 'langchain/util/time';

	import {
		customLLMEndpoints as cLLME,
		globalStatus as gs,
		localStoreRune
	} from './stores/globalStatus.svelte.js';
	import { getSubState } from './stores/subState.svelte';

	// /** @type {import('@langchain/core/messages').AIMessageChunk} */
	let fixArray = $state();
	let buttonText = $state('');
	let fetchNum = $state(0);
	let fetchEndNum = $state(0);

	let customOptions = localStoreRune('customOptions', {
		endpoint: '',
		model: '',
		apiKey: '',
		commands: '',
		chunkSize: undefined
	});

	const { subState } = getSubState();
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
		const sub = subState.subs[0];

		if (typeof sub.content === 'object' && sub.content.cues) {
			const toSend = sub?.content.cues?.map((sub, index) => {
				return index + ' - ' + sub.text;
				// return sub.text;
			});

			// Split `toSend` into chunks of 10
			const chunkSize = customOptions?.chunkSize ?? toSend.length;
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
						apiUrl: customOptions?.endpoint,
						model: customOptions?.model,
						apiKey: customOptions?.apiKey,
						commands: customOptions?.commands
					})
				);
				formData.append('data', JSON.stringify(chunk));
				return fetch('/api/custom-llm', { method: 'POST', body: formData }).then((res) => {
					fetchEndNum += 1;
					return res.formData();
					return res.json();
				});
			});

			// Await all promises and maintain order
			const results = await Promise.all(promises);
			console.log(results);
			// Extract the `kwargs` from each result and flatten them
			const responses = results.flatMap((r) => {
				const result = JSON.parse(r.get('data'));
				console.log(result.kwargs.content);
				if (result.kwargs.content) {
					let llmOutput = result.kwargs.content;
					if (llmOutput.slice(0, 7) === '```json\n') {
						llmOutput = llmOutput.replace('```json', '').replace('\n```', '');
						llmOutput;
					}
					return llmOutput.replaceAll('},\n]', '}]').replaceAll(`'}`, `'"}`); //Small fix for naziJSONparser
				}
			});

			console.log(responses);
			if (gs) {
				gs['transcriptionCorrectionsRaw'] = [];
			}
			//Concatenate arrays inside responses into a single array
			fixArray = responses.flatMap((res) => {
				try {
					if (gs) {
						gs['transcriptionCorrectionsRaw'].push(res);
					}
					res = JSON.parse(res);
				} catch (error) {
					console.log('Error parsing JSON', error);
					console.log('JSON:', res);
				}
				return res;
			});
			gs.transcriptionCorrections = fixArray;
			// buttonText = responses.join(' ').replaceAll('_:_', 'a');
		}
	};

	const handleChangeRaw = async (e) => {
		// e.target.value;
		// try {
		// 	gs.transcriptionCorrections = JSON.parse(e.target.value);
		// } catch (error) {
		// 	console.log('Error parsing JSON', error);
		// 	console.log('JSON:', e.target.value);
		// }

		gs.transcriptionCorrections = gs.transcriptionCorrectionsRaw.flatMap((rawChunk) => {
			try {
				return JSON.parse(rawChunk);
			} catch (error) {
				console.log('Error parsing JSON', error);
				console.log('JSON:', rawChunk);
			}
		});
	};
</script>

<div>
	<details class="custom-model-container">
		<summary>New Model Configuration</summary>
		<form
			onsubmit={(e) => {
				const formData = new FormData(e.target);
				console.log(formData);
				const endpoint = formData.get('endpoint') || '';
				const model = formData.get('model') || '';
				const apiKey = formData.get('apiKey') || '';
				const commands = formData.get('commands') || '';
				const chunkSize = formData.get('chunkSize') ? Number(formData.get('chunkSize')) : undefined;

				cLLME.value.endpoints.push({ endpoint, model, apiKey, commands, chunkSize });
				// Reset form
				e.target.reset();
				e.preventDefault();
			}}
		>
			<div>
				<p>Only works on the Original Column!</p>
				Enter your AI endpoint (OpenAi API), if empty default llm will be used:
				<input type="text" name="endpoint" />
				<p>Your model name</p>
				<input type="text" name="model" />
			</div>
			<div>
				Enter your API key:
				<input type="text" name="apiKey" />
				<br />
				Chunk Size (empty will be a single api call, useful if there is a limit on api call)
				<input type="number" name="chunkSize" />
				<p>Enter your instructions:</p>
				<textarea name="commands"></textarea>
			</div>
			<button type="submit"> Add New Model config</button>
		</form>
	</details>
	{#each cLLME.value.endpoints as cO}
		<details class="custom-model-container">
			<summary>
				{cO.endpoint == '' ? 'default' : cO.endpoint}<b>{cO.model}</b>
			</summary>
			<div>
				Base URL:
				<input type="text" bind:value={cO.endpoint} />
				Model Name:
				<input type="text" bind:value={cO.model} />
			</div>
			<div>
				API key:
				<input type="text" bind:value={cO.apiKey} />
				<br />
				Chunk Size:
				<input type="number" bind:value={cO.chunkSize} />
				<p>Model Specific Instructions:</p>
				<textarea bind:value={cO.commands}></textarea>
			</div>
		</details>
	{/each}

	<select
		onchange={(e) => {
			customOptions = cLLME.value.endpoints[e.target.value ?? 0];
		}}
	>
		{#each cLLME.value.endpoints as cO, index}
			<option value={index}>
				{cO.endpoint == '' ? 'default' : cO.endpoint}{cO.model}
			</option>
		{/each}
	</select>

	<p>Enter addtional instructions:</p>
	<textarea bind:value={customOptions.commands}></textarea>

	<button onclick={clickHandler} disabled={fetchEndNum !== fetchNum}>
		{fetchEndNum === fetchNum ? 'Get Hints!' : `Loading ${fetchEndNum}/${fetchNum}`}
	</button>

	{#if gs?.transcriptionCorrectionsRaw?.length > 0}
		<details>
			<summary>Edit Raw Answer Chunks {gs?.transcriptionCorrectionsRaw?.length}</summary>
			{#each gs?.transcriptionCorrectionsRaw as rawChunk, index}
				<textarea bind:value={gs.transcriptionCorrectionsRaw[index]} onchange={handleChangeRaw}>
				</textarea>
			{/each}
		</details>
	{/if}
	{#if gs?.transcriptionCorrections?.length > 0}
		<div style="">
			<table>
				<tbody>
					{#each gs.transcriptionCorrections as res}
						{#if res.index && res.errorString && res.correctionString}
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
						{/if}
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
	.custom-model-container {
		border: 1px solid gray;
		border-radius: 16px;
		padding: 4px;
	}
</style>
