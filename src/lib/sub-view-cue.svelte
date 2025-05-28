<script lang="ts">
	import { globalStatus as gs } from '$lib/stores/globalStatus.svelte';
	import type { VTTCueInit } from 'vidstack';
	import LtrslSingle from './ltrsl-single.svelte';
	import { subState } from './stores/subState.svelte';
	import { cueDoubleToTimeString, timeStringToCueDouble, timeToCSSIdentifier } from './utility';

	const { key, cueIndex, cue }: { key: string; cueIndex: number; cue: VTTCueInit } = $props();

	const handleSplit = (
		target: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement },
		cueIndex: number,
		key: string
	) => {
		if (target.key !== '§') return;
		target.preventDefault();
		const originalCue = subState.subs[key].content.cues[cueIndex];
		const fullLenght = originalCue.text.length;
		const cursorPosition = window.getSelection()?.anchorOffset ?? 0;

		if (cursorPosition === 0 || cursorPosition === fullLenght) return; //Better to add a new cue

		const splitted = originalCue.text.slice(0, cursorPosition);
		const splitted2 = originalCue.text.slice(cursorPosition, fullLenght);
		const newSplitTime =
			originalCue.startTime +
			(originalCue.endTime - originalCue.startTime) * (cursorPosition / fullLenght);

		subState.subs[key].content.cues.splice(cueIndex + 1, 0, {
			text: splitted2,
			startTime: newSplitTime,
			endTime: originalCue.endTime
		});

		originalCue.text = splitted;
		originalCue.endTime = newSplitTime; //after, breaks the value before
	};

	const handleMerge = (
		target: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement },
		cueIndex: number,
		key: string
	) => {
		const originalCue = subState.subs[key].content.cues[cueIndex];

		const nextCue =
			subState.subs[key].content.cues
				.filter((cue, i) => i !== cueIndex && cue.startTime >= originalCue.endTime)
				.sort((a, b) => a.startTime - b.startTime)[0] || null;
		console.log(nextCue, 'nextCue');
		if (!nextCue) return;

		originalCue.text += nextCue.text;
		originalCue.endTime = nextCue.endTime;

		subState.subs[key].content.cues.splice(subState.subs[key].content.cues.indexOf(nextCue), 1);
	};
	// console.log(cue?.text?.includes('ErrorInChunk'),cue, 'cue');
</script>

<div
	id={`cue_${key}-${cueIndex}`}
	class="cue"
	style={`
            grid-column-start: _${key};
            grid-row-start: ${timeToCSSIdentifier(cue.startTime)};
            grid-row-end: ${timeToCSSIdentifier(cue.endTime)};

            // Time view
            // position: absolute; 
            // overflow:hidden;
            // width:100%;
            // top:${(cue.startTime / gs.player.duration) * 100}%;
            // min-height:fit-content;
            // height:${((cue.endTime - cue.startTime) / gs.player.duration) * 100}%;
            `}
>
	{#if cue?.text?.includes('ErrorInChunk')}
		<LtrslSingle chunkNumber={Number(cue.text.split('-')[1])} />
	{:else}
		<div
			class="cue-text"
			onkeydown={(e) => handleSplit(e, cueIndex, key)}
			contenteditable="true"
			role="textbox"
			tabindex="0"
			bind:textContent={cue.text}
		></div>
		<div>
			<button
				class="cue-merge"
				onclick={(e) => {
					e.currentTarget.innerText = 'Double Click to merge with next cue (will skip empty spots)';
				}}
				onfocusout={(e) => {
					e.currentTarget.innerText = '+';
				}}
				ondblclick={(e) => {
					handleMerge(e, cueIndex, key);
					e.currentTarget.innerText = '+';
				}}
			>
				+
			</button>
		</div>
		<div>
			<button
				class="cue-delete"
				onclick={(e) => {
					e.currentTarget.innerText = 'Double Click to Delete';
				}}
				onfocusout={(e) => {
					e.currentTarget.innerText = 'X';
				}}
				ondblclick={(e) => {
					subState.subs[key].content.cues.splice(cueIndex, 1);
					subState.resetSavedState(key);
				}}
			>
				X
			</button>
		</div>
		<div
			class="start cue-time"
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
			aria-label="start cue-time"
		></div>

		<div
			class="end cue-time"
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
			aria-label="end cue-time"
		></div>
	{/if}
</div>

<style>
	.cue {
		/* border: 1px black solid; */
		background-color: color-mix(in srgb, var(--primary-color-active) 30%, transparent);
		border-radius: 8px;
		margin: 4px;
		/* margin-top: 0px; */
		padding: 8px;
		position: relative;
		z-index: 0;

		&::before {
			/* border: 1px solid gray; */
			width: 110%;
			height: 140%;
			display: none;
			content: '';
			position: absolute;
			top: -20%;
			left: -5%;
			z-index: 95;
		}
		& * {
			z-index: 100;
		}

		&:hover,
		&:focus-within {
			& * {
				z-index: 100;
			}

			.cue-time,
			.cue-merge,
			.cue-text,
			.cue-delete {
				display: block;
			}
		}
		&:hover {
			&::before {
				display: block;
			}
		}
		&:focus-within {
			&::before {
				display: none;
			}
		}

		.cue-time {
			position: absolute;
			border-radius: 4px;
			padding: 4px;
			font-size: 0.8em;
			background-color: color-mix(in srgb, var(--primary-color-active) 100%, transparent);
			display: none;

			&:focus {
				display: block;
			}

			&.start {
				top: -16px;
				left: -12px;
			}
			&.end {
				bottom: -16px;
				right: -0px;
			}
		}
		.cue-merge {
			display: none;
			position: absolute;
			right: 50%;
			bottom: -24px;
			color: white;
			border-radius: 4px;
			padding: 4px;
			cursor: pointer;
		}
		.cue-delete {
			display: none;
			position: absolute;
			right: 0px;
			top: -24px;
			color: white;
			border-radius: 4px;
			padding: 4px;
			cursor: pointer;
		}
		.cue-text {
			position: relative;
		}
	}
</style>
