<script lang="ts">
	import { customLLMEndpoints as cLLME } from '../stores/globalStatus.svelte';
</script>

<div>
	<details class="custom-model-container">
		<summary>Add New Model</summary>
		<form
			onsubmit={(e) => {
				const formData = new FormData(e.currentTarget);
				console.log(formData);
				const endpoint = String(formData.get('endpoint') || '');
				const model = String(formData.get('model') || '');
				const apiKey = String(formData.get('apiKey') || '');
				const commands = String(formData.get('commands') || '');
				const chunkSize = formData.get('chunkSize') ? Number(formData.get('chunkSize')) : undefined;

				cLLME.value[crypto.randomUUID()] = {
					endpoint,
					model,
					apiKey,
					commands,
					chunkSize
				};
				// Reset form
				e.currentTarget.reset();
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
	<br />
	{#each Object.entries(cLLME.value) as [key, cO]}
		<details class="custom-model-container">
			<summary>
				{cO.endpoint == '' ? 'default' : cO.endpoint}/<b>{cO.model}</b>
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
</div>

<style>
	.custom-model-container {
		border: 1px solid gray;
		border-radius: 16px;
		padding: 4px;
		height: auto;
	}
</style>
