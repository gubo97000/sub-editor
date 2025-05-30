<script lang="ts">
	import HintList from '$lib/llm-tabs/hint-list.svelte';
	import { sleep } from 'langchain/util/time';
	import type { EventHandler } from 'svelte/elements';
	import {
		customLLMEndpoints as cLLME,
		globalStatus as gs,
		sessionStorageRune
	} from '../stores/globalStatus.svelte';
	import { subState } from '../stores/subState.svelte';

	let fixArray = $state<HintListArray>([]);

	let fetchNum = $state(0);
	let fetchEndNum = $state(0);
	let cps = sessionStorageRune<{
		transcriptionCorrectionsRaw: string[];
		transcriptionCorrections: HintListArray;
		commands: string;
		lastSelectedModel: string;
	}>('TranslationHelper', {
		transcriptionCorrectionsRaw: [],
		transcriptionCorrections: [],
		commands: '',
		lastSelectedModel: ''
	})!; //componentPersistentState

	// const { subState } = getSubState();

	const componentPreamble = `You are an expert Finnish speaker, check for error or possible improvements in the following list of strings,
     INSTRUCTIONS:
    - is very possible that no error or suggestions are found, SKIP the subtitle 
    - You only need to check for mistranscriptions, mistakes, capitalization based on the context
    - checking the prase before and after helps understanding the context
    - do NOT talk, ONLY output an JSON COMPLIANT array of this elements: {"index": number, "errorString":string, "correctionString":string, "note"?:string}
    - if no corrections are found output: "[]"
    - start with '['
	`;

	type HintListArray = Array<{
		index: number;
		errorString: string;
		correctionString: string;
		note?: string;
	}>;

	const fecthQuery = async (customOptions: {
		model: typeof cLLME.value extends Record<any, infer V> ? V : never;
		commands: string;
	}) => {
		fetchEndNum = 0;
		fetchNum = 0;
		const sub = subState.subs[1];

		if (typeof sub.content === 'object' && sub.content.cues) {
			const toSend = sub?.content.cues?.map((sub, index) => {
				return index + ' - ' + sub.text;
				// return sub.text;
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
						query: componentPreamble + '\n' + cps.commands + '\n' + customOptions.model.commands
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
				cps['transcriptionCorrectionsRaw'] = [];
			}
			//Concatenate arrays inside responses into a single array
			fixArray = responses.flatMap((res: string) => {
				let jsonRes: HintListArray = [];
				try {
					if (gs) {
						cps['transcriptionCorrectionsRaw'].push(res);
					}
					jsonRes = JSON.parse(res) as HintListArray;
				} catch (error) {
					console.error('Error parsing JSON', error);
					console.error('JSON:', jsonRes);
				}
				return jsonRes;
			});
			cps.transcriptionCorrections = fixArray;
			// buttonText = responses.join(' ').replaceAll('_:_', 'a');
		}
	};

	const submitHandler: EventHandler<SubmitEvent> = async (e) => {
		const formData = new FormData(e.currentTarget as HTMLFormElement);
		const model = formData.get('model')?.toString() || '';
		const commands = formData.get('commands')?.toString() || '';
		const customOptions = cLLME.value[model];
		fecthQuery({ model: customOptions, commands });
	};

	const handleChangeRaw = async () => {
		cps.transcriptionCorrections = cps.transcriptionCorrectionsRaw.flatMap((rawChunk) => {
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
	<form onsubmit={submitHandler}>
		<div>Select the LLM to use:</div>
		<select
			name="model"
			onchange={(e) => {
				cps.lastSelectedModel = e.currentTarget.value;
			}}
		>
			<option disabled selected value> -- select an option -- </option>
			{#each Object.entries(cLLME.value) as [key, cO], index}
				<option value={key} selected={cps?.lastSelectedModel === key}>
					{cO.endpoint == '' ? 'default' : cO.endpoint}/{cO.model}
				</option>
			{/each}
		</select>

		<details>
			<summary> Preamble </summary>
			<textarea disabled>{componentPreamble}</textarea>
		</details>
		<!-- <div>Enter your instructions:</div>
		<textarea name="commands" bind:value={cps.commands}></textarea> -->

		<button type="submit" disabled={fetchEndNum !== fetchNum}>
			{fetchEndNum === fetchNum ? 'Get Hints!' : `Loading ${fetchEndNum}/${fetchNum}`}
		</button>
	</form>

	{#if cps.transcriptionCorrectionsRaw?.length > 0}
		<details>
			<summary>Edit Raw Answer Chunks {cps.transcriptionCorrectionsRaw.length}</summary>
			{#each cps.transcriptionCorrectionsRaw as rawChunk, index}
				<textarea bind:value={cps.transcriptionCorrectionsRaw[index]} onchange={handleChangeRaw}>
				</textarea>
			{/each}
		</details>
	{/if}
	<HintList hintList={cps.transcriptionCorrections} subIndex={1} />
</div>

<style>
</style>
