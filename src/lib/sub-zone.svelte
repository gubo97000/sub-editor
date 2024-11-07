<script>
	import { getSubState } from '$lib/stores/subState.svelte';

	import { VTTToSrt } from '../lib/subs.js';
	import LtrslSingle from './ltrsl-single.svelte';
	import { getGlobState } from './stores/globalStatus.svelte.js';

	const { subState } = getSubState();
	const { globState: gs } = getGlobState();

	/**
	 * @typedef {Object} MyProps
	 * @property {(time: number) => void} goToTime
	 */

	/** @type {MyProps} */
	const { goToTime } = $props();

	/**
	 * @param
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
</script>

<table>
	<thead>
		<tr>
			<th>Time</th>
			<th>
				Original
				<button onclick={() => exportSub(subState.subs['en-US'], 'srt')}>export</button>
				<button onclick={() => exportSub(subState.subs['en-US'], 'txt')}>txt</button>
			</th>
			<th
				>Finnish
				<button onclick={() => exportSub(subState.subs['fi-FI'], 'srt')}>export</button>
				<button onclick={() => exportSub(subState.subs['fi-FI'], 'srt')}>txt</button>
			</th>
		</tr>
	</thead>
	<tbody>
		{#if typeof subState.subs['en-US']?.content === 'object' && subState.subs['en-US']?.content.cues}
			{#each subState.subs['en-US']?.content.cues as cue, cueIndex}
				<tr class={gs.time && gs.time >= cue.startTime && gs.time <= cue.endTime ? 'active' : ''}>
					<td class="time">
						<button
							onclick={() => {
								goToTime(cue.startTime);
							}}
						>
							<!-- {parseInt(cue.startTime.toString().split('.')[0])/60 + cue.startTime.toString().split('.')[1]} -->
							{new Date(cue.startTime * 1000)
								.toISOString()
								.substr(11, 8)
								.replace(/^(00:)(?=\d{2}:)/, '') +
								'.' +
								cue.startTime.toFixed(3).toString().split('.')[1]}
						</button>
					</td>
					<td id={`en${cueIndex}`}>
						{#if !subState.err['en-US']}
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
					{#if typeof subState.subs['fi-FI']?.content === 'object' && subState.subs['fi-FI']?.content.cues}
						<td>
							{#if subState.subs['fi-FI'].content.cues[cueIndex].text.includes('ErrorInChunk')}
							<LtrslSingle chunkNumber={subState.subs['fi-FI'].content.cues[cueIndex].text.split('-')[1]} />
							{/if}
						
						<div
						contenteditable="true"
						bind:textContent={subState.subs['fi-FI'].content.cues[cueIndex].text}
					>
						{subState.subs['fi-FI'].content.cues[cueIndex].text}
					</div>
						
							
						</td>
					{/if}
				</tr>
			{/each}
		{/if}
	</tbody>
</table>

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
			display: block;
			border: none;
			border-radius: 15px;
		}
		& .subtitle {
			display: flex;
			height: 100%;
		}
	}
</style>
