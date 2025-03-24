<script>
	import Auth from '$lib/auth.svelte';
	import { PANOPTO_LANGUAGE_CODES, VTTToSrt } from '$lib/subs';
	import { Dialog, Label, Separator } from 'bits-ui';
//Copied from +page.svelte /panopto-folder
	import { authedFetch } from '$lib/apiWrapper';
	import { panoptoAuth as pA } from '$lib/stores/globalStatus.svelte';
	import { getSubState } from '$lib/stores/subState.svelte';

	/**
	 * Props for the TranscribeButton component.
	 *
	 * @typedef {Object} Props
	 * @property {number} [presetSubtitleIndex] - Preset what subtitle is chosen
	 */

	/** @type {Props} */
	const { presetSubtitleIndex } = $props();

	let ret = $state([]);
	let availableLanguages = $state([]);
	let selectedLanguage = $state('');
	let selectedPanoptoVideo = $state('');
	let subToSaveKey = $state(presetSubtitleIndex?.toString());
	const subState = getSubState().subState;

	$inspect(ret, availableLanguages);

	// Put this onOpen of the dialog 🔴
	fetch(
		`/api/v1/proxy/Api/Folders?parentId=null&folderSet=3&includeMyFolder=true&includePersonalFolders=true&page=0&sort=Depth&names%5B0%5D=SessionCount`
	)
		.then((res) => res.json())
		.then((json) => {
			// console.log(json);
			// ret = json;
			return json;
		})
		.then((folder) => {
			Promise.all(
				folder.flatMap((r) => {
					if (r.SessionCount > 0) {
						// console.log(r.SessionCount);
						return fetchFolderContent(r.Id);
					}
					return [];
				})
			).then((data) => {
				ret = data.flatMap((d) => {
					return d.Results;
				});
				return data;
			});
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
		let data = await res.json();
		if (data.Results.length > 0) {
			// console.log(data.Results);
			data.Results = data.Results.concat(
				(await fetchFolderContent(folderId, index + 1))?.Results ?? []
			);
		}
		// console.log(data);
		return data;
	};

	const onSelectChange = async (e) => {
		console.log(e.target.value);
		availableLanguages = await authedFetch(`/api/v1/proxy/Pages/Viewer/DeliveryInfo.aspx`, {
			method: 'POST',
			headers: {
				// 'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				deliveryId: e.target.value,
				isLiveNotes: 'false',
				refreshAuthCookie: 'false',
				isActiveBroadcast: 'false',
				isEditing: 'false',
				isKollectiveAgentInstalled: 'false',
				isEmbed: 'true',
				responseType: 'json'
			})
		})
			.then((res) => res.json())
			.then((data) => {
				return data.Delivery.AvailableLanguages.map((lId) => {
					return PANOPTO_LANGUAGE_CODES[lId];
				});
			});
	};

	const onSubmit = async () => {
		// const language = 'Italian';
		let srt = VTTToSrt(
			subState.subs[subToSaveKey]?.content?.cues.map((cue) => {
				return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
			})
		);
		let blob = new Blob([srt], { type: 'text/plain' });
		console.log(subState.subs[subToSaveKey], selectedPanoptoVideo);
		console.log(srt, blob);

		await fetch(
			`/api/v1/proxy/api/v1/sessions/${selectedPanoptoVideo}/captions/languages/${selectedLanguage}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: 'Bearer ' + pA?.accessToken
				}
			}
		).then(() => {
			const formData = new FormData();
			formData.append('language', selectedLanguage);
			formData.append('', new File([blob], 'sub-editor.srt', { type: 'text/plain' }));
			fetch(`/api/v1/proxy/api/v1/sessions/${selectedPanoptoVideo}/captions`, {
				method: 'POST',
				headers: {
					Authorization: 'Bearer ' + pA?.accessToken
				},
				body: formData
			});
		});
		return true;
	};
</script>

<Dialog.Root>
	<Dialog.Trigger>
		Save in Panopto
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Title></Dialog.Title>
			<Dialog.Description />
			<Auth />
			<div>
				Subtitle to Upload:
				<select bind:value={subToSaveKey} >
					{#each Object.entries(subState?.subs) as [key, sub]}
						<option value={key}> {sub.label}</option>
					{/each}
				</select>
			</div>
			<div>
				Receiving Video
				<select onchange={onSelectChange} bind:value={selectedPanoptoVideo}>
					{#each ret as r}
						<option value={r?.Id}> {r?.FolderDetails?.Name}/{r?.Name}</option>
					{/each}
				</select>
			</div>

			<div>
				Language of subtitle
				<select bind:value={selectedLanguage}>
					{#each PANOPTO_LANGUAGE_CODES as l}
						<option value={l}>
							{l}
							{availableLanguages.includes(l) ? '🔴 (Overwrite)' : ''}
						</option>
					{/each}
				</select>
			</div>

			<button onclick={onSubmit}>
				{availableLanguages.includes(selectedLanguage)
					? 'Send to Panopto (🔴 Overwrite)'
					: 'Send to Panopto'}
			</button>
			<!-- <Dialog.Close /> -->
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* Base styles */
	:global([data-dialog-content]) {
		background-color: rgba(121, 212, 116, 0.611);
		position: absolute;
		top: 10%;
		left: 50%;

		border-radius: 16px;

		backdrop-filter: blur(4px);
	}

	/* Trigger styles based on state */
	:global([data-dialog-overlay]) {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		/* backdrop-filter: blur(4px); */
	}


	/* Content styles */
	:global([data-dialog-content]) {
		padding: 1rem;
	}
</style>
