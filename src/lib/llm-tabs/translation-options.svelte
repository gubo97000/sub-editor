<script lang="ts">

	import {
		customLLMEndpoints as cLLME,
		globalStatus as gs,
		localStoreRune
	} from '../stores/globalStatus.svelte';
	import { subState } from '../stores/subState.svelte';


	let cps = localStoreRune<{
		commands: string;
		lastSelectedModel: string;
	}>('TranslationOptions', {
		commands: '',
		lastSelectedModel: ''
	})!; //componentPersistentState

	// const { subState } = getSubState();

	const componentPreamble = `You are an expert english to finnish translator, 
	translate the following list of strings from English to Finnish in the most natural sounding way possible, 
	output list has to have the SAME number of strings be VERY careful, do not talk, only create the list, omit \`\`\`json, start with '[': `
</script>

<div>
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

	<!-- 
{#if cps.transcriptionCorrectionsRaw?.length > 0}
	<details>
		<summary>Edit Raw Answer Chunks {cps.transcriptionCorrectionsRaw.length}</summary>
		{#each cps.transcriptionCorrectionsRaw as rawChunk, index}
			<textarea bind:value={cps.transcriptionCorrectionsRaw[index]} onchange={handleChangeRaw}>
			</textarea>
		{/each}
	</details>
{/if} -->
</div>
