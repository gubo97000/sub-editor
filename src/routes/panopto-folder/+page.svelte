<!-- https://aalto.cloud.panopto.eu/Panopto/Api/Folders?parentId=null&folderSet=3&includeMyFolder=false&includePersonalFolders=true&page=0&sort=Depth&names%5B0%5D=SessionCount -->
<script>
	import { panoptoAuth as pA } from '$lib/stores/globalStatus.svelte';
	let ret = $state([]);

	// "https://aalto.cloud.panopto.eu/Panopto/Pages/Transcription/GenerateSRT.ashx?id=ba16432b-aa6d-4a84-abbc-b274007767ef&language=English_GBR"

	fetch(
		`/api/v1/proxy/Api/Folders?parentId=null&folderSet=3&includeMyFolder=true&includePersonalFolders=true&page=0&sort=Depth&names%5B0%5D=SessionCount`
	)
		.then((res) => res.json())
		.then((json) => {
			console.log(json);
			ret = json;
		});
	const fetchFolderContent = async (folderId = '', index = 0) => {
		const res = await fetch(
			// '/api/v1/proxy/api/v1/folders/40fa6209-4bac-4128-87ef-af100065a3f2/sessions',
			`/api/v1/proxy/api/v1/folders/${folderId}/sessions?pageNumber=${index}`, //without page number will loop forever
			{
				method: 'GET',
				headers: {
					Authorization: 'Bearer ' + pA?.accessToken
				}
			}
		);
		// if (!res.ok) {
		// 	if (res.status === 401) {
		// 		console.log('401 error', window);
		// 		// Open the URL in a new tab
		// 		console.log(window.open(authEndpoint, '_blank'));
		// 	}
		// 	return;
		// }
		let data = await res.json();
		if (data.Results.length > 0) {
			console.log(data.Results);
			data.Results = data.Results.concat(
				(await fetchFolderContent(folderId, index + 1))?.Results ?? []
			);
		}
		console.log(data);
		return data;
	};
	$effect(() => {
		if (ret) {
			Promise.all(
				ret.flatMap((r) => {
					if (r.SessionCount > 0) {
						console.log(r.SessionCount);
						fetchFolderContent(r.Id);
					}
				})
			).then((data) => {
				console.log(data);
				return data;
			});
		}
	});
</script>

<div>
	{#each ret as ret}
		{#if ret.SessionCount > 0}
			<a href="/panopto-folder/{ret.Id}" data-sveltekit-preload-data="tap">
				<p>{ret.Name} {ret.SessionCount}</p>
			</a>
		{/if}
	{/each}
</div>

<style>
	
</style>