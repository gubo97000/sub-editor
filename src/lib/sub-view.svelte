<script lang="ts">
	import { globalStatus as gs } from '$lib/stores/globalStatus.svelte';
	import { subState } from '$lib/stores/subState.svelte.js';
	import { get } from 'idb-keyval';
	import { getContext, onMount } from 'svelte';
	import { MediaPlayer } from 'vidstack';
	import { MediaPlayerElement } from 'vidstack/elements';
	import PanoptoUploadDialog from './dialog/panopto-upload-dialog.svelte';
	import LtrslSingle from './ltrsl-single.svelte';
	import Ltrsl from './ltrsl.svelte';
	import SubViewCue from './sub-view-cue.svelte';
	import SubtitleSelect from './subtitle-select.svelte';
	import TranscribeButton from './transcribeButton.svelte';
	import {
		cueDoubleToTimeString,
		exportSub,
		timeStringToCueDouble,
		timeToCSSIdentifier
	} from './utility';

	const p = getContext<() => MediaPlayerElement>('player');
	const u = getContext('utils');

	const goToTime = (time: number) => {
		if (!p?.()) return;
		p().currentTime = time + 0.01;
	};

	/**
	 * Retrieves all available time values.
	 *
	 * @returns {Array} An array containing all time values.
	 */
	const getAllTimes = () => {
		let times: number[] = [0];
		for (let sub of Object.values(subState.subs)) {
			times.push(...sub.content.cues.flatMap((c) => [c.startTime, c.endTime]));
		}
		times.push(gs.player.duration);
		times.sort((a, b) => a - b);
		return (times = [...new Set(times)]);
	};

	const getGridTemplateRows = () => {
		let times = getAllTimes();
		return times.map((t) => `[${timeToCSSIdentifier(t)}]`).join(' auto ');
	};
	const gridTemplateRowsString = $derived(getGridTemplateRows());
	const allTimes = $derived(getAllTimes());

	const isSlotOccupied = (
		trackKey: string,
		slotStartTime: number,
		slotEndTime: number
	): boolean => {
		const track = subState.subs[trackKey];
		if (!track || !track.content || !track.content.cues) {
			return false;
		}
		for (const cue of track.content.cues) {
			// Check if the cue overlaps with the slot
			if (cue.startTime < slotEndTime && cue.endTime > slotStartTime) {
				return true;
			}
		}
		return false;
	};
</script>

<div style="height:100%; overflow-y:scroll;">
	<!-- <SubtitleSelect autoLoad={['en-US', 'en', 'auto']} index={0} />
	<SubtitleSelect autoLoad={['fi-FI', 'fi', 'auto']} index={1} /> -->

	<div
		style={`
        display:grid; 
        grid-template-rows:[header] auto ${gridTemplateRowsString};
        // grid-template-columns:[time] auto ${Object.keys(subState.subs)
					.map((c) => `[_${c}]`)
					.join(' auto ')} auto [last] auto;
		grid-template-columns: [time] auto [_0] auto [_1] auto [last] auto;
        `}
	>
		<div
			style={`
                display:grid;
                grid-row-start: header;
                grid-column: 1 / -1;

                grid-template-columns: subgrid;
                
                background-color: var(--primary-color);
                font-weight: bold;
            `}
		>
			<div
				style={`
					grid-row-start: header;
					grid-column-start: time;
				`}
			>
				Time
			</div>
			<div
				style={`
                    grid-row-start: header;
                    grid-column-start: _0;
                `}
			>
				Original
				<SubtitleSelect autoLoad={['en-US', 'en', 'auto']} index={0} />
				<button
					onclick={(e) => {
						if (u.saveSubtitle(subState.subs[0], subState.video, e.target)) {
							subState.resetSavedState(0);
						}
					}}
					disabled={subState.isSaved(0)}
				>
					Save
				</button>
				<PanoptoUploadDialog presetSubtitleIndex={0} />
				<button onclick={() => exportSub(subState.subs[0], 'srt')}>export</button>
				<button onclick={() => exportSub(subState.subs[0], 'txt')}>txt</button>
			</div>
			<div
				style={`
                    grid-row-start: header;
                    grid-column-start: _1;
                `}
			>
				Finnish
				<SubtitleSelect autoLoad={['fi-FI', 'fi', 'auto']} index={1} />
				<button
					onclick={(e) => {
						if (u.saveSubtitle(subState.subs[1], subState.video, e.target)) {
							subState.resetSavedState(1);
						}
					}}
					disabled={subState.isSaved(1)}
				>
					Save
				</button>
				<PanoptoUploadDialog presetSubtitleIndex={1} />
				<button onclick={() => exportSub(subState.subs[1], 'srt')}>export</button>
				<button onclick={() => exportSub(subState.subs[1], 'txt')}>txt</button>
				{#if subState.subs[1]?.content?.cues?.length === 0}
					<Ltrsl />
				{/if}
			</div>
		</div>

		{#each allTimes as time}
			<div
				class={'time' + (gs.time >= time ? ' active' : '')}
				style={`
					grid-row-start: ${timeToCSSIdentifier(time)};
					grid-column-start: time;
				`}
				role="button"
				tabindex="0"
				onclick={() => goToTime(time)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						goToTime(time);
						e.preventDefault();
					}
				}}
				aria-label={`Go to time ${cueDoubleToTimeString(time)}`}
			>
				<div class="time-text">
					{cueDoubleToTimeString(time)}
				</div>
			</div>
		{/each}

		<!-- Placeholders for Empty Slots -->

		{#each Object.keys(subState.subs) as trackKey}
			{#if subState.subs[trackKey]?.id === '_transcribe'}
				<TranscribeButton
					style={`
                                grid-column-start: _${trackKey};
                                grid-row-start: ${timeToCSSIdentifier(0)};
                                aling-items: center;
                                justify-content: center;
                            `}
					videoFile={subState.video}
				/>
			{:else}
				{#each allTimes as slotStartTime, i}
					{#if i < allTimes.length - 1}
						{@const slotEndTime = allTimes[i + 1]}
						{#if !isSlotOccupied(trackKey, slotStartTime, slotEndTime)}
							<div
								class="placeholder"
								style={`
                                grid-column-start: _${trackKey};
                                grid-row-start: ${timeToCSSIdentifier(slotStartTime)};
                                grid-row-end: ${timeToCSSIdentifier(slotEndTime)};
                                background-color: rgba(255, 255, 0, 0.2);
                                aling-items: center;
                                justify-content: center;
                            `}
							>
								<div>
									{'<->'}
									{(slotEndTime - slotStartTime).toPrecision(2)}s

									<button
										onclick={() => {
											subState.subs[trackKey].content.cues.push({
												text: '',
												startTime: slotStartTime,
												endTime: slotEndTime
											});
											subState.subs[trackKey].content.cues.sort(
												(a, b) => a.startTime - b.startTime
											);
										}}
									>
										Insert
									</button>
								</div>
							</div>
						{/if}
					{/if}
				{/each}
			{/if}
		{/each}

		{#each Object.entries(subState.subs) as [key, value]}
			{#each value?.content.cues as cue, cueIndex}
				<!-- {#if cue?.text.includes('ErrorInChunk')}
					<LtrslSingle chunkNumber={cue.text.split('-')[1]} />
				{/if} -->
				<SubViewCue {cue} {cueIndex} {key} />
			{/each}
		{/each}
	</div>
</div>

<style>
	.time {
		height: fit-content;
		position: relative;
		margin-bottom: 4px;
		cursor: pointer;

		&.active {
			background-color: color-mix(in srgb, var(--primary-color-active) 50%, transparent);
		}

		&::before {
			border-top: 1px solid gray;
			width: 100%;
			/* height: 100px; */
			display: block;
			position: absolute;
			background-color: aqua;
			content: '';
		}
		.time-text {
			font-size: 0.8em;
			border-left: 1px solid black;
			border-radius: 8px;
			padding: 4px;
		}
	}

	.subtitle-column {
		height: 7000px;
		width: 300px;
		display: flex;
		flex-direction: column;
		position: relative;
	}
</style>
