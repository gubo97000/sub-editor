<script>
	import { page } from '$app/stores';
	import { localStore } from '$lib/localStore.svelte';
	import { panoptoAuth as pA } from '$lib/stores/globalStatus.svelte';
	import { onMount } from 'svelte';

	let folderIdStored = localStore('folderId', '');
	console.log(folderIdStored);
	let folder = $state([]);
	let folderId = $state(folderIdStored.value);
	$effect(() => {
		console.log(folder);
	});

	const fetchFolder = async (index = 0) => {
		const res = await fetch(
			// '/api/v1/proxy/api/v1/folders/40fa6209-4bac-4128-87ef-af100065a3f2/sessions',
			`/api/v1/proxy/api/v1/folders/${folderId}/sessions?pageNumber=${index}`, //without page number will loop forever
			{
				method: 'GET',
				headers: {
					Authorization: 'Bearer ' + pA.accessToken
				}
			}
		);
		let data = await res.json();
		if (data.Results.length > 0) {
			console.log(data.Results);
			data.Results = data.Results.concat((await fetchFolder(index + 1))?.Results ?? []);
		}
		console.log(data);
		return data;
	};
	const fetchHandler = async () => {
		folder = await fetchFolder();
		folderIdStored.value = folderId;
	};
</script>

<div>
	<form onsubmit={(e) => e.preventDefault()}>
		Checking folder <input bind:value={folderId} type="text" />
		<button type="submit" onclick={fetchHandler()}> Search </button>
	</form>
</div>
<div>
	{#each folder?.Results as item}
		<div class="item">
			<a href="/edit/{item.Id}">{item.Name}</a>
			<!-- <a href="https://aalto.cloud.panopto.eu/Panopto/Podcast/Download/{item.Id}.mp4?mediaTargetType=videoPodcast">{item.Name}</a> -->
			<!-- <a href={item.Urls.CaptionDownloadUrl}>{item.Name}</a> -->
		</div>
	{/each}
</div>

<style>
	.item {
		margin: 10px;
		border: 1px solid black;
	}
</style>
