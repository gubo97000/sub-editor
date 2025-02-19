<script>
	import { getSubState } from '$lib/stores/subState.svelte';

	import AuthButton from '$lib/auth.svelte';
	import { verifyPermission } from '$lib/utility.js';
	import ViewEdit from '$lib/view-edit.svelte';
	import { text } from '@sveltejs/kit';
	import { directoryOpen, fileOpen, fileSave, supported } from 'browser-fs-access';
	import { get, set } from 'idb-keyval';
	import { parseByteStream, parseText } from 'media-captions';
	import { onMount, setContext } from 'svelte';
	import { FullscreenButton, Time } from 'vidstack';
	import 'vidstack/player';
	import 'vidstack/player/layouts/plyr';
	import 'vidstack/player/styles/base.css';
	import 'vidstack/player/styles/plyr/theme.css';
	import 'vidstack/player/ui';

	/**
	 * Represents a single video entry with associated files.
	 *
	 * @typedef {Object} VideoFile
	 * @property {File} video - The main video file.
	 * @property {File} subFile - The subtitle file associated with the video (e.g., original
	 *   subtitles).
	 * @property {File} errorFile - The file containing parsing or error information.
	 * @property {File} subCorFile - The corrected subtitle file.
	 * @property {File} subFinFile - The translated subtitle file.
	 * @property {File} subCorFinFile - The corrected translated subtitle file.
	 */

	/**
	 * Represents the temporary video library used during folder scanning or processing.
	 *
	 * @typedef {Object<string, Partial<VideoFile>>} VideoLibrary
	 */

	/** @type {VideoLibrary} */
	// let videoLib = $state({});
	let context = $state({ videoLib: {} });
	// $inspect(videoLib);
	/** @type {FileSystemDirectoryHandle | undefined} */
	let folderHandle = $state();
	$effect(() => {
		if (!folderHandle) return;
		scanFolder(folderHandle);
		return () => {};
	});

	onMount(() => {
		get('folderHandle').then((res) => {
			if (res) {
				console.log('found cached folder handle', res);
				folderHandle = res;
			}
		});
		return () => {};
	});

	/**
	 * Asynchronously retrieves a list of files from the specified directory handle.
	 *
	 * @param {FileSystemDirectoryHandle} dirHandle - The handle of the directory from which to
	 *   retrieve the file list.
	 * @returns {Promise<File[]>} A promise that resolves to an array of file handles.
	 */
	const getFilesList = async (dirHandle) => {
		if (!dirHandle) return [];
		let promises = [];
		for await (const entry of dirHandle.values()) {
			if (entry.kind === 'file') {
				promises.push(
					/** @type {FileSystemFileHandle} */ (entry).getFile().then((file) => {
						return file;
					})
				);
			} else {
				promises.push(...(await getFilesList(/** @type {FileSystemDirectoryHandle} */ (entry))));
			}
		}
		return await Promise.all(promises);
	};

	/**
	 * Asynchronously retrieves a list of files from the specified directory handle.
	 *
	 * @param {FileSystemDirectoryHandle} dirHandle - The handle of the directory from which to
	 *   retrieve the file list.
	 * @param {string} parent - The parent directory name.
	 */
	const getFilesDictFlatTree = async (dirHandle, parent) => {
		if (!dirHandle) return [];
		/** @type {[string, File][]} */
		let promises = [];

		for await (const entry of dirHandle.values()) {
			if (entry.kind === 'file') {
				promises.push([
					parent + entry.name,
					await /** @type {FileSystemFileHandle} */ (entry).getFile()
				]);
			} else {
				promises.push(
					...(await getFilesDictFlatTree(
						/** @type {FileSystemDirectoryHandle} */ (entry),
						parent + '/' + entry.name + '/'
					))
				);
			}
		}
		return promises;
	};

	/**
	 * Scans the contents of a directory.
	 *
	 * @param {FileSystemDirectoryHandle} dirHandle - The handle to the directory to scan.
	 */
	const scanFolder = async (dirHandle) => {
		//Strategy Names: ./video_name.languageAndInformations.srt
		//Strategy Folder: ./languageAndInformations/video_name.srt

		const files = await getFilesList(dirHandle);
		const filesTree = await getFilesDictFlatTree(dirHandle, '');
		console.log('tree', filesTree);

		/** @type {VideoLibrary} */
		const videoLibTemp = {};
		files.map((file) => {
			if (file.type.includes('video')) {
				videoLibTemp[file.name.split('.').slice(0, -1).join()] = { video: file };
				return file;
			}
		});

		for (const [filePath, file] of filesTree) {
			const fileName = file.name.split('.').slice(0, -1).join(); //video_name
			const fileExt = file.name.split('.').slice(-1).join(); //srt
			if (!videoLibTemp[fileName]) continue;
			try {
				// if (file.webkitRelativePath.includes('/output/')) {
				// console.log(file);
				// console.log(filePath);
				if (filePath.includes('/SubtitlesLukas/')) {
					// if (!videoLib[file.name.split('.').slice(0, -1).join()]) continue;
					if (file.type.includes('json')) {
						videoLibTemp[fileName]['errorFile'] = file;
					}
					if (file.name.includes('.srt')) {
						videoLibTemp[fileName]['subFile'] = file;
					}
				}
				if (filePath.includes('/SubtitlesCorrected/')) {
					if (file.name.includes('.srt')) {
						videoLibTemp[fileName]['subCorFile'] = file;
					}
				}
				if (filePath.includes('/Translations/')) {
					// if (!videoLib[file.name.split('.').slice(0, -1).join()]) continue;
					if (file.name.includes('.srt')) {
						videoLibTemp[fileName]['subFinFile'] = file;
					}
				}
				if (filePath.includes('/TranslationsCorrected/')) {
					// if (!videoLib[file.name.split('.').slice(0, -1).join()]) continue;
					if (file.name.includes('.srt')) {
						videoLibTemp[fileName]['subCorFinFile'] = file;
					}
				}
			} catch (e) {
				console.error('what', fileName);
				console.error(e);
			}
		}

		console.log('scanned Folder', videoLibTemp);
		// videoLib.videoLib = videoLibTemp;
		context.videoLib = videoLibTemp;
		// videoLib = videoLibTemp;
		// return videoLibTemp;
	};

	//Get the folder
	const handleGetFolder = async () => {
		// const blobsInDirectory = await directoryOpen(
		// 	recursive: true
		// });
		// console.log(blobsInDirectory);
		console.log('handleGetFolder');
		if ('showDirectoryPicker' in self) {
			// @ts-ignore
			folderHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
			if (!folderHandle) return;
			console.log('saving folderHandle', folderHandle);
			set('folderHandle', folderHandle); // Saving on IndexedDb
			// localStorage.setItem('folderHandle', JSON.stringify(folderHandle));

			scanFolder(folderHandle);

			console.log(videoLib);
			return folderHandle;
		}
	};

	const loadVideoEntry = async (/** @type {string} */ id) => {
		return context.videoLib[id].video;
	};
	const loadSubtitles = async (/** @type {string} */ id) => {
		//Temporary 🔴
		return [
			context.videoLib[id]?.subFile
				? { text: context.videoLib[id]?.subFile, id: 'en-US', language: 'English' }
				: null,
			context.videoLib[id]?.subCorFile
				? { text: context.videoLib[id]?.subCorFile, id: 'en-UK', language: 'En-Corrected' }
				: null,
			context.videoLib[id]?.subFinFile
				? { text: context.videoLib[id]?.subFinFile, id: 'fi-FI', language: 'Finnish' }
				: null,
			context.videoLib[id]?.subCorFinFile
				? { text: context.videoLib[id]?.subCorFinFile, id: 'fi-FI', language: 'Fi-Finnish' }
				: null
		].filter((file) => file);
	};

	setContext('videoLib', context);

	setContext('utils', {
		loadVideoEntry,
		loadSubtitles
	});
</script>

<div>
	<button onclick={handleGetFolder}>Open Folder</button>
	{#if folderHandle}
		Folder <b>{folderHandle.name}</b> opened.
		<b>{Object.entries(context?.videoLib ?? []).length}</b>
		videos found.
		{#await verifyPermission(folderHandle, true)}
			<!-- <div>Permission granted</div> -->
		{:then value}
			{#if value}
				<!-- <div>Permission granted</div> -->
			{:else}
				<div>Permission denied. The software need file permissions to work</div>
			{/if}
		{/await}
	{/if}
	<!-- <AuthButton /> -->
</div>

<ViewEdit />
