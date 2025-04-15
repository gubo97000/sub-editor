<script>
	import { getSubState } from '$lib/stores/subState.svelte';

	import { globalStatus as gs } from '$lib/stores/globalStatus.svelte';
	import { getContext } from 'svelte';
	import { VTTToSrt } from '../lib/subs.js';
	import PanoptoUploadDialog from './dialog/panopto-upload-dialog.svelte';
	import LtrslSingle from './ltrsl-single.svelte';
	import Ltrsl from './ltrsl.svelte';
	import SubtitleSelect from './subtitle-select.svelte';
	import TranscribeButton from './transcribeButton.svelte';
	import { cueDoubleToTimeString, timeStringToCueDouble } from './utility.js';

	const { subState } = getSubState();
	const c = getContext('videoLib');
	const u = getContext('utils');
	$inspect(subState);
	/**
	 * @typedef {Object} MyProps
	 * @property {(time: number) => void} goToTime
	 */

	/** @type {MyProps} */
	const { goToTime } = $props();

	/**
	 * @param {import('vidstack').TextTrackInit} sub
	 * @param {'txt' | 'srt'} format
	 */
	const exportSub = (sub, format) => {
		if (typeof sub.content !== 'object') return;
		if (!sub.content.cues) return;
		const data = sub?.content?.cues.map((cue) => {
			return { text: cue.text, startTime: cue.startTime, endTime: cue.endTime };
		});
		switch (format) {
			case 'srt':
				const srt = VTTToSrt(data);
				const blob = new Blob([srt], { type: 'text/plain' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${gs.selectedVideo}.srt`;
				a.click();
				break;
			case 'txt':
				const txt = data
					.map((cue) => {
						return `${cue.text}`;
					})
					.join(' ');
				const blob2 = new Blob([txt], { type: 'text/plain' });
				const url2 = URL.createObjectURL(blob2);
				const a2 = document.createElement('a');
				a2.href = url2;
				a2.download = `${gs.selectedVideo}.txt`;
				a2.click();
				break;
			default:
				break;
		}
	};

	/**
	 * Swaps the positions of two cues in the list.
	 *
	 * @param {number} index - The index of the first cue to swap.
	 * @param {number} swapIndex - The index of the second cue to swap.
	 */
	const swapCue = (index, swapIndex) => {
		if (swapIndex < 0) return;
		const temp = subState.subs[1].content.cues[index].text;
		subState.subs[1].content.cues[index].text = subState.subs[1].content.cues[swapIndex].text;
		subState.subs[1].content.cues[swapIndex].text = temp;
	};
</script>

<div style="height:100%;overflow:scroll;">
	<table>
		<thead>
			<tr>
				<th>Original Time</th>
				<th>
					Original
					<SubtitleSelect autoLoad={['en-US', 'en', 'auto']} index={0} />
					<button
						onclick={(e) => {
							u.saveSubtitle(subState.subs[0], subState.video, e.target);
						}}
					>
						Save
					</button>
					<PanoptoUploadDialog presetSubtitleIndex={0} />
					<button onclick={() => exportSub(subState.subs[0], 'srt')}>export</button>
					<button onclick={() => exportSub(subState.subs[0], 'txt')}>txt</button>
				</th>
				<th>
					Finnish
					<SubtitleSelect autoLoad={['fi-FI', 'fi', 'auto']} index={1} />
					<button
						onclick={() => {
							u.saveSubtitle(subState.subs[1], subState.video);
						}}
					>
						Save
					</button>
					<PanoptoUploadDialog presetSubtitleIndex={1} />
					<button onclick={() => exportSub(subState.subs[1], 'srt')}>export</button>
					<button onclick={() => exportSub(subState.subs[1], 'txt')}>txt</button>
				</th>
				<th>Finnish Time</th>
			</tr>
		</thead>
		<tbody>
			{#if typeof subState.subs[0]?.content === 'object' && subState.subs[0]?.content.cues}
				{#if subState.subs[0].id === '_transcribe'}
					<tr>
						<td></td>
						<td> <TranscribeButton videoFile={subState.video} /> </td></tr
					>
				{:else}
					{#each subState.subs[0]?.content.cues as cue, cueIndex}
						<tr
							class={gs.time && gs.time >= cue.startTime && gs.time <= cue.endTime ? 'active' : ''}
						>
							<td class="time">
								<button
									onclick={() => {
										goToTime(cue.startTime);
									}}
									class={(gs.time && gs.time >= cue.startTime && gs.time <= cue.endTime
										? 'active'
										: '') + ' jump'}
								>
									<!-- {Math.round(gs.time)} -->
								</button>
								<div
									class="start"
									contenteditable="true"
									onfocusout={(e) => {
										cue.startTime = timeStringToCueDouble(e.currentTarget.innerText);
									}}
									bind:textContent={
										() => {
											cue.startTime ? cue.startTime : 0;
											return cueDoubleToTimeString(cue.startTime);
										},
										() => {}
									}
									aria-label="start time"
								></div>

								<div
									class="end"
									contenteditable="true"
									onfocusout={(e) => {
										cue.endTime = timeStringToCueDouble(e.currentTarget.innerText);
									}}
									bind:textContent={
										() => {
											cue.endTime ? cue.endTime : 0;
											return cueDoubleToTimeString(cue.endTime);
										},
										() => {}
									}
									aria-label="end time"
								></div>
							</td>
							<td id={`cue_0-${cueIndex}`}>
								{#if !subState.err[0]}
									<div
										class="subtitle"
										contenteditable="true"
										bind:textContent={cue.text}
										style={subState.err['en-US'] ? 'display:none' : ''}
									>
										{cue.text}
									</div>
								{:else}
									<div style="width:100%; display: flex; flex-direction: column;">
										<div
											contenteditable="true"
											oninput={(e) => {
												cue.text = e.currentTarget.innerText;
												console.log(e.currentTarget.innerText);
											}}
										>
											{#each subState.err['en-US'].segments[cueIndex].words as word}
												<span
													style={`color: color-mix(in srgb, green ${Math.round(word.score * 100)}%, red`}
												>
													{word.word}{' '}
												</span>
											{/each}
										</div>
									</div>
								{/if}
							</td>
							{#if typeof subState.subs[1]?.content === 'object' && subState.subs[1]?.content.cues}
								{#if subState.subs[1].id === '_translate'}
									<td> <Ltrsl /> </td>
								{:else}
									{#each [subState.subs[1]?.content.cues[cueIndex]] as cue}
										<td id={`cue_1-${cueIndex}`}>
											{#if subState.subs[1].content.cues[cueIndex]?.text.includes('ErrorInChunk')}
												<LtrslSingle
													chunkNumber={subState.subs[1].content.cues[cueIndex].text.split('-')[1]}
												/>
											{/if}
											{#if subState.subs[1].content.cues[cueIndex]?.text.includes('ErrorInChunk')}
												<bold>Missing Cue!</bold>
											{/if}
											{#if !subState.subs[1].content.cues[cueIndex]?.startTime}
												Probably a cue is missing
											{/if}
											{#if !subState.subs[1].content.cues[cueIndex]?.text}
												<button onclick={() => swapCue(cueIndex, cueIndex - 1)}>swap up</button>
												<button onclick={() => swapCue(cueIndex, cueIndex + 1)}>swap down</button>
											{/if}
											{#if subState.subs[1].content.cues[cueIndex]}
												<div
													contenteditable="true"
													style={!subState.subs[1].content.cues[cueIndex]?.text &&
														'border: 1px solid gray'}
													bind:textContent={subState.subs[1].content.cues[cueIndex].text}
												>
													{subState.subs[1].content.cues[cueIndex]?.text}
												</div>
											{/if}
										</td>
										<td class="time">
											{#if subState.subs[1].content.cues[cueIndex]?.text}
												<button
													onclick={() => {
														goToTime(cue.startTime);
													}}
													class={(gs.time && gs.time >= cue.startTime && gs.time <= cue.endTime
														? 'active'
														: '') + ' jump'}
												>
													<!-- {Math.round(gs.time)} -->
												</button>
												<div
													class="start"
													contenteditable="true"
													onfocusout={(e) => {
														cue.startTime = timeStringToCueDouble(e.currentTarget.innerText);
													}}
													bind:textContent={
														() => {
															cue.startTime ? cue.startTime : 0;
															return cueDoubleToTimeString(cue.startTime);
														},
														() => {}
													}
													aria-label="start time"
												></div>

												<div
													class="end"
													contenteditable="true"
													onfocusout={(e) => {
														cue.endTime = timeStringToCueDouble(e.currentTarget.innerText);
													}}
													bind:textContent={
														() => {
															cue.endTime ? cue.endTime : 0;
															return cueDoubleToTimeString(cue.endTime);
														},
														() => {}
													}
													aria-label="end time"
												></div>
											{/if}
										</td>
									{/each}
								{/if}
							{/if}
						</tr>
					{/each}
				{/if}
			{/if}
		</tbody>
	</table>
	<div id="previewContainerContainer"></div>
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
	table {
		/* border: 1px solid black; */
		td {
			border: 1px solid grey;
			border-radius: 10px;
			padding: 5px;
			min-height: 10px;
			height: 50px;
		}
		& .time {
			padding: 0;
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr 1fr;
			grid-template-areas:
				'time start'
				'time end';

			border: none;
			border-radius: 15px;
			font-size: 0.9em;
			& button {
				margin: 0;
				/* border: none; */
				/* background-color: transparent; */
			}
			& .jump {
				grid-area: time;
				border-radius: 500px;
				align-self: center;
				justify-self: center;
				width: 50%;
				height: 50%;
				&.active {
					background-color: var(--primary-color-active);
					width: 80%;
					height: 80%;
				}
			}
			& .start {
				grid-area: start;
				background-color: transparent;
				border: none;
				width: 100%;
				height: 100%;
				margin: 0 4px;
			}
			& .end {
				color: gray;
				grid-area: end;
				background-color: transparent;
				border: none;
				width: 100%;
				height: 100%;
				margin: 0 4px;
			}
		}
		& .subtitle {
			display: flex;
			height: 100%;
		}
	}
</style>
