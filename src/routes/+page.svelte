<script>
	import ApiTest from '$lib/api-test.svelte';
	import AuthButton from '$lib/auth.svelte';
	import CheckTrslZone from '$lib/check-trsl-zone.svelte';
	import LlmZone from '$lib/llm-zone.svelte';
	import Ltrsl from '$lib/ltrsl.svelte';
	import { globalStatus as gs } from '$lib/stores/globalStatus.svelte';
	import { getSubState } from '$lib/stores/subState.svelte';
	import SubZone from '$lib/sub-zone.svelte';
	import { verifyPermission } from '$lib/utility.js';
	import { directoryOpen, fileOpen, fileSave, supported } from 'browser-fs-access';
	import { get, set } from 'idb-keyval';
	import { parseByteStream, parseText } from 'media-captions';
	import { onMount } from 'svelte';
	import { FullscreenButton, Time } from 'vidstack';
	import 'vidstack/player';
	import 'vidstack/player/layouts/plyr';
	import 'vidstack/player/styles/base.css';
	import 'vidstack/player/styles/plyr/theme.css';
	import 'vidstack/player/ui';

	// import type { MediaPlayerElement } from 'vidstack/elements';

	const { subState } = getSubState();
	/** @type {import('vidstack/elements').MediaPlayerElement?} } */
	let player = $state(null);

	/** @type {{ parsingErrors: { message: string }[] }} */
	let alerts = $state({ parsingErrors: [] });

	/** @type {FileList | null} */
	let files = $state(null);
	// /** @type {FileList | null} */
	// let subFiles = $state(null);
	// /** @type {FileList | null} */
	// let subErrorFiles = $state(null);
	/** @type {boolean} */
	let correctSub = $state(false);
	/** @type {boolean} */
	let correctTranslateSub = $state(false);
	/** @type {'transcriptionHelper' | 'translationHelper'} */
	let showTab = $state('transcriptionHelper');
	// let videoLib = $derived.by(() => {
	// 	/**
	// 	 * @type {Object<
	// 	 * 	string,
	// 	 * 	{
	// 	 * 		video: File;
	// 	 * 		subFile?: File;
	// 	 * 		errorFile?: File;
	// 	 * 		subFinFile?: File;
	// 	 * 		subCorFile?: File;
	// 	 * 		subCorFinFile?: File;
	// 	 * 	}
	// 	 * >}
	// 	 */
	// 	const videoLib = {};
	// 	console.log(directory);
	// 	if (directory) {
	// 		//find video file
	// 		for (const video of directory) {
	// 			if (video.type.includes('video')) {
	// 				videoLib[video.name.split('.').slice(0, -1).join()] = { video: video };
	// 			}
	// 		}
	// 		for (const file of directory) {
	// 			const fileName = file.name.split('.').slice(0, -1).join();
	// 			// if (file.webkitRelativePath.includes('/output/')) {
	// 			if (file.webkitRelativePath.includes('/SubtitlesLukas/')) {
	// 				// if (!videoLib[file.name.split('.').slice(0, -1).join()]) continue;
	// 				if (file.type.includes('json')) {
	// 					videoLib[fileName]['errorFile'] = file;
	// 				}
	// 				if (file.name.includes('.srt')) {
	// 					videoLib[fileName]['subFile'] = file;
	// 				}
	// 			}
	// 			if (file.webkitRelativePath.includes('/SubtitlesCorrected/')) {
	// 				if (file.name.includes('.srt')) {
	// 					videoLib[fileName]['subCorFile'] = file;
	// 				}
	// 			}
	// 			if (file.webkitRelativePath.includes('/Translations/')) {
	// 				// if (!videoLib[file.name.split('.').slice(0, -1).join()]) continue;
	// 				if (file.name.includes('.srt')) {
	// 					videoLib[fileName]['subFinFile'] = file;
	// 				}
	// 			}
	// 			if (file.webkitRelativePath.includes('/TranslationsCorrected/')) {
	// 				// if (!videoLib[file.name.split('.').slice(0, -1).join()]) continue;
	// 				if (file.name.includes('.srt')) {
	// 					videoLib[fileName]['subCorFinFile'] = file;
	// 				}
	// 			}
	// 		}
	// 	}
	// 	console.log('videolib', videoLib);
	// 	console.log(
	// 		'loaded translations',
	// 		Object.entries(videoLib).reduce((acc, [k, cur]) => acc + (cur?.subFinFile ? 1 : 0), 0)
	// 	);
	// 	return videoLib;
	// });
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
	let videoLib = $state({});

	onMount(() => {
		get('folderHandle').then((res) => {
			if (res) {
				console.log('found cached folder handle', res);
				folderHandle = res;
			}
		});
		return () => {};
	});

	/** @type {FileSystemDirectoryHandle | undefined} */
	let folderHandle = $state();
	$effect(() => {
		if (!folderHandle) return;
		scanFolder(folderHandle);
		return () => {};
	});

	const updateSubs = () => {
		if (!player) return;
		// console.log(subState.subs);
		Object.entries(subState.subs).forEach(([key, sub]) => {
			if (sub.content) {
				// console.log('sub', sub);
				// console.log(sub.content);
				// sub.content.cues.forEach((cue) => {
				// 	console.log(cue.text);
				// });
				// console.log(sub.content.cues[0]);
				// console.log(sub.content.cues[0].text);
			}
		});
		let trackShowing =
			player.textTracks.toArray().find((track) => {
				return track.mode === 'showing';
			})?.id ?? 'en-US';
		player.textTracks.clear();
		for (const [_, sub] of Object.entries(subState.subs)) {
			console.log($state.snapshot(sub));
			player.textTracks.add({ ...sub, default: sub.id === trackShowing });
		}

		if (player.paused) {
			player.currentTime += 0.01;
			setTimeout(() => {
				if (!player) return;
				player.currentTime -= 0.01;
			}, 1);
		}
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
		videoLib = videoLibTemp;
		// return videoLibTemp;
	};

	/**
	 * Asynchronously retrieves video files from the given directory handle.
	 *
	 * @param {FileSystemDirectoryHandle} dirHandle - The handle to the directory from which to
	 *   retrieve video files.
	 * @returns {Promise<File[]>} A promise that resolves to an array of video files.
	 */
	const getVideoFiles = async (dirHandle) => {
		const files = await getFilesList(dirHandle);
		return files.flatMap((file) => {
			if (file.type.includes('video')) {
				return file;
			} else {
				return [];
			}
		});
	};

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

	$effect(() => {
		updateSubs();
	});

	/** @param {number} time */
	const goToTime = (time) => {
		if (!player) return;
		player.currentTime = time + 0.01;
	};

	// //On videoFile change
	$effect(() => {
		if (!player) return;
		if (files?.[0]) {
			player.src = { src: files?.[0], type: 'video/object' };
		}
		// console.log(files);
		// console.log(
		// 	files?.[0] ??
		// 		'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
		// );
		// console.log(player?.src);
		// console.log(player);
	});

	/** @param {File} file */
	const setSubFile = (file) => {
		// parseByteStream(file.stream(), {
		// 	type: 'srt',
		// 	errors: true,
		// 	onError: (e) => console.error(e)
		// }).then((res) => {
		// 	const cont = {
		// 		cues: res.cues.map((cue) => {
		// 			return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
		// 		})
		// 	};
		// 	subState.subs['en-US'] = {
		// 		id: 'en-US',
		// 		content: $state.snapshot(cont),
		// 		label: `English-Loaded`,
		// 		kind: 'captions',
		// 		default: true,
		// 		language: 'en-US',
		// 		type: 'json'
		// 	};
		// });

		subtitleParser(file, {
			id: 'en-US',
			label: `English-Loaded`,
			kind: 'captions',
			default: true,
			language: 'en-US',
			type: 'json'
		});
	};

	/** @param {File} file */
	const setFinSubFile = (file) => {
		// parseByteStream(file.stream(), {
		// 	type: 'srt',
		// 	strict: true
		// }).then(
		// 	(res) => {
		// 		if (!res) return;
		// 		const cont = {
		// 			cues: res.cues.map((cue) => {
		// 				return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
		// 			})
		// 		};
		// 		subState.subs['fi-FI'] = {
		// 			id: 'fi-FI',
		// 			content: $state.snapshot(cont),
		// 			label: `Finnish-Translated`,
		// 			kind: 'captions',
		// 			default: true,
		// 			language: 'fi-FI',
		// 			type: 'json'
		// 		};
		// 	},
		// 	(error) => {
		// 		// Error case, timestamp could be corrupted e.g. 00:03:23,453000000000001
		// 		// Error case, timestamp could be corrupted e.g. 00:03:23,undefined
		// 		console.log('trying alternative method');
		// 		file.text().then((text) => {
		// 			//grabs correct pattern and throws away the rest of digits
		// 			const fixedText = text
		// 				.replace(/(\d{2}:\d{2}:\d{2},\d{1,3})(\d*)/g, (match, p1) => {
		// 					return p1;
		// 				})
		// 				// remove undefined and change it to 000
		// 				.replace(/(\d{2}:\d{2}:\d{2},)undefined/g, (match, p1) => {
		// 					return p1 + '000';
		// 				});
		// 			parseText(fixedText, {
		// 				type: 'srt',
		// 				errors: true,
		// 				onError: (e) => {
		// 					console.error(e);
		// 				}
		// 			}).then((res) => {
		// 				alerts['parsingErrors'].push({
		// 					message:
		// 						file.name +
		// 						' finnish subtitles, problems during parsing, please check for missing cues. If everything is ok, Export and override the file (the bug might have been fixed)'
		// 				});
		// 				if (!res) return;
		// 				const cont = {
		// 					cues: res.cues.map((cue) => {
		// 						return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
		// 					})
		// 				};
		// 				subState.subs['fi-FI'] = {
		// 					id: 'fi-FI',
		// 					content: $state.snapshot(cont),
		// 					label: `Finnish-Translated`,
		// 					kind: 'captions',
		// 					default: true,
		// 					language: 'fi-FI',
		// 					type: 'json'
		// 				};
		// 			});
		// 		});
		// 	}
		// );

		subtitleParser(file, {
			id: 'fi-FI',
			label: `Finnish-Translated`,
			kind: 'captions',
			default: true,
			language: 'fi-FI',
			type: 'json'
		});
	};

	/**
	 * Add Text Track to the state, needs a template for information and options
	 *
	 * @param {File} file
	 * @param {Omit<import('vidstack').TextTrackInit & { id: string }, 'content'>} template
	 */

	const subtitleParser = (file, template) => {
		parseByteStream(file.stream(), {
			type: 'srt',
			strict: true
		}).then(
			(res) => {
				if (!res) return;
				const cont = {
					cues: res.cues.map((cue) => {
						return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
					})
				};
				subState.subs[template.id] = {
					...template,
					content: cont
				};
			},
			(error) => {
				// Dry run to show errors in console
				parseByteStream(file.stream(), {
					type: 'srt',
					errors: true,
					onError: (e) => {
						console.error(e);
					}
				});
				// Error case, timestamp could be corrupted e.g. 00:03:23,453000000000001
				// Error case, timestamp could be corrupted e.g. 00:03:23,undefined
				console.log('trying alternative method');
				file.text().then((text) => {
					//grabs correct pattern and throws away the rest of digits
					const fixedText = text
						.replace(/(\d{2}:\d{2}:\d{2},\d{1,3})(\d*)/g, (match, p1) => {
							return p1;
						})
						// remove undefined and change it to 000
						.replace(/(\d{2}:\d{2}:\d{2},)undefined/g, (match, p1) => {
							return p1 + '000';
						});
					parseText(fixedText, {
						type: 'srt',
						errors: true,
						onError: (e) => {
							console.error(e);
						}
					}).then((res) => {
						alerts['parsingErrors'].push({
							message: `${file.name} ${template.label ?? template.id} subtitles, problems during parsing, please check for missing cues. If everything is ok, Export and override the file (the bug might have been fixed)`
						});
						if (!res) return;
						const cont = {
							cues: res.cues.map((cue) => {
								return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
							})
						};
						subState.subs[template.id] = {
							...template,
							content: cont
						};
					});
				});
			}
		);
	};

	/** @param {File} file */
	const setSubErrorFile = (file) => {
		file.text().then((res) => {
			subState.err['en-US'] = JSON.parse(res);
		});
	};

	// //On subFile change
	// $effect(() => {
	// 	if (!player) return;
	// 	if (subFiles?.[0]) {
	// 		setSubFile(subFiles?.[0]);
	// 	}
	// });
	// //On subErrorFile change
	// $effect(() => {
	// 	if (!player) return;
	// 	if (subErrorFiles?.[0]) {
	// 		subErrorFiles?.[0].text().then((res) => {
	// 			subState.err['en-US'] = JSON.parse(res);
	// 			// content = res;
	// 		});
	// 	}
	// });

	//On gs.selectedVideo change
	$effect(() => {
		console.log(gs.selectedVideo);
		if (!player) return;
		if (!videoLib[gs.selectedVideo]) return;
		if (gs.selectedVideo) {
			const selectedVideo = gs.selectedVideo;
			alerts.parsingErrors = [];
			subState.subs = {};
			subState.err = {};
			if (videoLib[selectedVideo].video)
				player.src = { src: videoLib[selectedVideo].video, type: 'video/object' };

			if (correctSub && videoLib[selectedVideo]?.subCorFile !== undefined) {
				console.log(videoLib[selectedVideo]?.subCorFile?.webkitRelativePath);
				setSubFile(videoLib[selectedVideo].subCorFile);
			} else if (videoLib[selectedVideo]?.subFile)
				setSubFile(videoLib[selectedVideo].subFile);

			if (correctTranslateSub && videoLib[selectedVideo]?.subCorFinFile)
				setFinSubFile(videoLib[selectedVideo].subCorFinFile);
			else if (videoLib[selectedVideo]?.subFinFile)
				setFinSubFile(videoLib[selectedVideo].subFinFile);
			if (!correctSub)
				if (videoLib[selectedVideo]?.errorFile)
					setSubErrorFile(videoLib[selectedVideo].errorFile);
		}
	});

	onMount(() => {
		if (!player) return;
		/** You can add these tracks using HTML as well. */
		// for (const track of textTracks) player.textTracks.add(track);

		// Subscribe to state updates.
		return player.subscribe(({ paused, viewType, currentTime, textTracks }) => {
			gs.time = currentTime;

			// console.log('is audio view?', '->', viewType === 'audio');
			// console.log('textTracks', '->', textTracks);
			// console.log(JSON.stringify(textTracks[0]));
			// console.log(textTracks[0]);
			// console.log(res.data)
			// console.log('current time', '->', currentTime);
			// console.log(gs.time)
		});
		console.log(player?.src);
	});
</script>

<div class="container">
	<!-- <div>
		<AuthButton />
		<ApiTest></ApiTest>
	</div> -->
	<!-- {#each subtitlesArray as subs}
		<SubtitleContainer title={subs.name} data={subs.data} />
	{/each} -->
	<!-- src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" -->
	<div style="position:sticky; top:0; height: 100vh; display:flex; flex-direction: column;">
		<div>
			<button onclick={handleGetFolder}>Open Folder</button>
			{#if folderHandle}
				Folder <b>{folderHandle.name}</b> opened. <b>{Object.entries(videoLib).length}</b> videos
				found.
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
			<!-- <details open={true}>
				<summary>Manage Local Folder</summary>
				<button onclick={updateSubs}>Update Subtitles</button>

				<p>Folder Load (set the parent folder that contains video and subs)</p>
				<div>
					<div>
						<label for="folder-btn" class="btn">Select Folder</label>
						<input id="files" style="visibility:hidden;" type="file" />
						<input id="files" type="file" bind:files={directory} webkitdirectory />
					</div>

					
					<div>
						{#if gs.selectedVideo && videoLib[gs.selectedVideo].subCorFile}
							<label for="correctSub">
								<input type="checkbox" id="correctSub" bind:checked={correctSub} />
								Correct Subs
							</label>
						{/if}
						{#if gs.selectedVideo && videoLib[gs.selectedVideo].subCorFinFile}
							<label for="correctTranslateSub">
								<input
									type="checkbox"
									id="correctTranslateSub"
									bind:checked={correctTranslateSub}
								/>
								Correct Translate
							</label>
						{/if}
					</div>
				</div>
			</details> -->
		</div>
		<select bind:value={gs.selectedVideo}>
			{#each Object.entries(videoLib).sort((a, b) => {
				return a[0] > b[0] ? 1 : -1;
			}) as [key, video]}
				<option value={key}>{(video.subFile ? (video.subFinFile ? '' : '🇫🇮') : '🔴') + key}</option>
			{/each}
		</select>
		{#each alerts.parsingErrors as error}
			<div class="alert">{error.message}</div>
		{/each}
		<media-player
			src="https://aalto.cloud.panopto.eu/Panopto/Podcast/Download/0a9d6bf7-d7b6-4383-9bad-b1d10084d451.mp4?mediaTargetType=videoPodcast"
			bind:this={player}
		>
			<media-provider> </media-provider>
			<media-plyr-layout></media-plyr-layout>
		</media-player>
		<!-- <details open={!subState.subs?.["en-US"]}> -->

		<br />
		<!-- <div>
			Legacy
			Video Upload
			<input type="file" bind:files />
			<div>
				Subs Upload
				<input type="file" bind:files={subFiles} accept=".srt" />
			</div>
			<div>
				Error Upload
				<input type="file" bind:files={subErrorFiles} accept=".json" />
			</div>
		</div> -->

		<div style="display:flex">
			<button
				class={`tab-button ${showTab === 'transcriptionHelper' && 'activeTab'}`}
				onclick={() => {
					showTab = 'transcriptionHelper';
				}}
			>
				Transcription Helper
			</button>
			{#if subState.subs['fi-FI']}
				<button
					class={`tab-button ${showTab === 'translationHelper' && 'activeTab'}`}
					onclick={() => {
						showTab = 'translationHelper';
					}}
				>
					Translation Helper
				</button>
			{/if}
			<Ltrsl />
		</div>
		<div class="activeTab" style="flex-grow: 1;">
			{#if showTab === 'transcriptionHelper'}
				<LlmZone />
			{/if}
			{#if showTab === 'translationHelper'}{/if}
			{#if showTab === 'translationHelper'}
				<CheckTrslZone />
			{/if}
		</div>
	</div>
	<SubZone {goToTime} />
</div>

<style>
	:global(body) {
		font-family: 'Roboto', sans-serif;
		font-size: 15px;
	}
	.container {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		/* width: 300px; */
	}
	.active {
		background-color: lightblue;
	}

	media-player {
		width: 600px;
		height: 400px;
	}
	.alert {
		background-color: rgba(255, 0, 0, 0.221);
		color: red;
		padding: 4px;
		border-radius: 8px;
		margin: 4px;
	}
</style>
