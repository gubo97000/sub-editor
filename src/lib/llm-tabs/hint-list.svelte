<script lang="ts">
	import { onMount } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import type { VTTContent } from 'vidstack';
	import { subState } from '../stores/subState.svelte';


	// const { subState } = getSubState();
	const { subIndex = 0, hintList = [] } = $props();
	let previewContainer: HTMLDivElement | undefined = $state();

	onMount(() => {
		let container = document.getElementById('previewContainerContainer');
		previewContainer = document.createElement('div');
		if (!container) {
			console.error('previewCOntainer Not found');
			return;
		}
		previewContainer.className = 'previewContainer';
		previewContainer.style.position = 'relative';
		container.appendChild(previewContainer);
		return () => {
			previewContainer?.remove();
		};
	});

	const scrollIntoView: MouseEventHandler<HTMLButtonElement> = (event) => {
		event.preventDefault();
		console.log(event.currentTarget.getAttribute('data-cue-tag'));
		const el = document.querySelector(event.currentTarget.getAttribute('data-cue-tag') ?? '');
		if (!el) return;
		el.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
		el.animate([{ backgroundColor: 'yellow' }, { backgroundColor: 'white' }], { duration: 1000 });
	};

	const scrollIntoViewFromId = (id: string) => {
		console.log(id);
		const el = document.querySelector(id);
		if (!el) return;
		el.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
		el.animate([{ backgroundColor: 'yellow' }, { backgroundColor: 'white' }], { duration: 1000 });
	};

	/** Creates an underline with a popup for the hint */
	const previewEditLine = (
		// event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
		hintIndex: number
	) => {
		// event.preventDefault();
		const el = document.querySelector(`#cue_${subIndex}-${hintList[hintIndex].index}`);
		if (!el) return;
		if (!previewContainer) return;

		// Get error information
		const errorSubString = hintList[hintIndex].errorString;
		const fixedSubString = hintList[hintIndex].correctionString;

		// Get the original element's position
		const rect = el.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

		// Find the text node containing our error
		const textContent = el.textContent || '';
		let textNode: Node;

		const walkNodes = (node: Node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				const content = node.textContent || '';
				if (content.includes(errorSubString)) {
					textNode = node;
					return true;
				}
			} else {
				for (let i = 0; i < node.childNodes.length; i++) {
					if (walkNodes(node.childNodes[i])) return true;
				}
			}
			return false;
		};

		walkNodes(el);

		if (!textNode) return;

		// Create a range to measure the exact position of the error text
		const range = document.createRange();
		const nodeContent = textNode.textContent || '';
		const errorInNodeIndex = nodeContent.indexOf(errorSubString);

		range.setStart(textNode, errorInNodeIndex);
		range.setEnd(textNode, errorInNodeIndex + errorSubString.length);

		const errorRect = range.getBoundingClientRect();

		// Create underline element
		const underline = document.createElement('div');
		underline.setAttribute('data-cue-tag', `#hint_${hintIndex}`);
		underline.className = 'hint-underline';
		underline.style.left = `${errorRect.left - previewContainer.getBoundingClientRect().left + scrollLeft}px`;
		underline.style.top = `${errorRect.bottom - previewContainer.getBoundingClientRect().bottom + scrollTop - 15}px`;
		underline.style.width = `${errorRect.width}px`;

		// Add tooltip with suggestion
		const tooltip = document.createElement('div');
		tooltip.className = 'hint-tooltip';
		tooltip.textContent = `${fixedSubString}`;
		tooltip.style.position = 'absolute';
		tooltip.style.bottom = '100%';
		tooltip.style.left = '0';
		tooltip.style.backgroundColor = 'white';
		tooltip.style.border = '1px solid #ccc';
		tooltip.style.padding = '4px 8px';
		tooltip.style.borderRadius = '4px';
		tooltip.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
		tooltip.style.zIndex = '1001';
		tooltip.style.fontSize = '14px';
		tooltip.style.whiteSpace = 'nowrap';
		// tooltip.style.opacity = '0';
		tooltip.style.display = 'none';

		//TODO: FIX SCROLL currently is a mess, this doesn't work
		// previewContainer?.parentNode?.parentNode?.addEventListener('scroll', (e) => {
		// 	const range = document.createRange();
		// 	const nodeContent = textNode.textContent || '';
		// 	const errorInNodeIndex = nodeContent.indexOf(errorSubString);

		// 	range.setStart(textNode, errorInNodeIndex);
		// 	range.setEnd(textNode, errorInNodeIndex + errorSubString.length);

		// 	const errorRect = range.getBoundingClientRect();

		// 	// Create underline element
		// 	// const underline =
		// 	// underline.setAttribute("data-cue-tag",`#hint_${hintIndex}`)
		// 	// underline.className = 'hint-underline';
		// 	underline.style.left = `${errorRect.left + scrollLeft}px`;
		// 	underline.style.top = `${errorRect.bottom + scrollTop - 15}px`;
		// 	underline.style.width = `${errorRect.width}px`;
		// });
		underline.appendChild(tooltip);

		// Add to document with fade-in effect
		previewContainer?.appendChild(underline);

		const container = el;
		const overlay = underline;
		let isCurrentlyHovering = false; // Track state

		container.addEventListener('mousemove', ((event: MouseEvent) => {
			const rect = overlay.getBoundingClientRect();

			const isHorizontallyInside = event.clientX >= rect.left && event.clientX <= rect.right;
			const isVerticallyInside = event.clientY >= rect.top && event.clientY <= rect.bottom;

			const isNowHovering = isHorizontallyInside && isVerticallyInside;

			if (isNowHovering && !isCurrentlyHovering) {
				// Mouse entered the overlay bounds
				overlay.classList.add('is-hovered');
				isCurrentlyHovering = true;
				// scrollIntoView(event)
				scrollIntoViewFromId(`#hint_${hintIndex}`);
				// console.log('Simulated Hover Enter');
			} else if (!isNowHovering && isCurrentlyHovering) {
				// Mouse left the overlay bounds
				overlay.classList.remove('is-hovered');
				isCurrentlyHovering = false;
				// console.log('Simulated Hover Leave');
			}
		}) as EventListener);

		container.addEventListener('mouseleave', () => {
			// Ensure hover state is removed if mouse leaves the container
			if (isCurrentlyHovering) {
				overlay.classList.remove('is-hovered');
				isCurrentlyHovering = false;
				// console.log('Simulated Hover Leave (Container Exit)');
			}
		});
	};

	// const previewEdit = (
	// 	event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
	// 	hintIndex: number
	// ) => {
	// 	event.preventDefault();
	// 	const el = document.querySelector(event.currentTarget.getAttribute('data-cue-tag') ?? '');
	// 	if (!el) return;

	// 	// Get the original element's position and dimensions
	// 	const rect = el.getBoundingClientRect();
	// 	const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
	// 	const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

	// 	// Create a copy of the element
	// 	const clone = el.cloneNode(true);

	// 	// Style the clone to position it over the original
	// 	clone.style.position = 'absolute';
	// 	clone.style.top = `${rect.top + scrollTop}px`;
	// 	clone.style.left = `${rect.left + scrollLeft}px`;
	// 	clone.style.width = `${rect.width}px`;
	// 	clone.style.height = `${rect.height}px`;
	// 	clone.style.zIndex = '1000';
	// 	clone.style.pointerEvents = 'none'; // So it doesn't interfere with clicks
	// 	clone.style.backgroundColor = 'red';

	// 	// Apply the edit to the clone
	// 	const errorSubString = hintList[hintIndex].errorString;
	// 	const fixedSubString = hintList[hintIndex].correctionString;
	// 	clone.innerHTML =
	// 		el.innerText?.replace(errorSubString, `<s>${errorSubString}</s> <b>${fixedSubString}</b>`) ??
	// 		'';

	// 	// Add the clone to the document body
	// 	document.body.appendChild(clone);

	// 	// Optional: Add animation or fade-out effect
	// 	setTimeout(() => {
	// 		clone.style.opacity = '0';
	// 		clone.style.transition = 'opacity 1s';
	// 		setTimeout(() => {
	// 			document.body.removeChild(clone);
	// 		}, 1000);
	// 	}, 2000);
	// };

	const applyEdit = (
		event: Parameters<MouseEventHandler<HTMLButtonElement>>[0],
		hintIndex: number,
		cueIndex: number
	) => {
		event.preventDefault();
		const errorSubString = hintList[hintIndex].errorString;
		const fixedSubString = hintList[hintIndex].correctionString;
		const original = subState.subs[subIndex].content.cues[cueIndex].text;
		// insertTextPreservingUndo(
		// 	document.querySelector(event.currentTarget.getAttribute('data-cue-tag') ?? ''),
		// 	subState.subs[subIndex].content.cues?.[cueIndex].text.replace(
		// 		errorSubString,
		// 		`${fixedSubString}`
		// 	) ?? ''
		// )
		subState.subs[subIndex].content.cues[cueIndex].text =
			subState.subs[subIndex].content.cues?.[cueIndex].text.replace(
				errorSubString,
				`${fixedSubString}`
			) ?? '';
		if (original !== subState.subs[subIndex].content.cues[cueIndex].text) {
			hintList[hintIndex].status = 'Applied';
			previewContainer.innerHTML = '';
			const el = document.querySelector(event.currentTarget.getAttribute('data-cue-tag') ?? '');
			if (!el) return;
			el.animate([{ backgroundColor: 'blue' }, { backgroundColor: 'white' }], { duration: 1000 });
			//Handle Success
			// event.currentTarget.textContent = 'Applied';
			// event.currentTarget.disabled = true;
			return;
		} else {
			//Handle fail
			hintList[hintIndex].status = 'Failed, apply manually';
			// event.currentTarget.disabled = true;
		}
	};

	$effect(() => {
		previewContainer.innerHTML = '';
		for (const hintIndex in hintList) {
			if (hintList[hintIndex].status) continue;
			previewEditLine(hintIndex);
		}
	});
</script>

{#if hintList?.length > 0}
	<div style="">
		<table>
			<tbody>
				{#each hintList as res, hintIndex}
					{#if res.index?.toString() && res.errorString}
						<tr
							data-cue-tag={`#cue_${subIndex}-${res.index}`}
							aria-disabled="true"
							id={`hint_${hintIndex}`}
						>
							<td>
								<button
									data-cue-tag={`#cue_${subIndex}-${res.index}`}
									onclick={(e) => {
										scrollIntoView(e);
										// previewEdit(e, hintIndex);
									}}
								>
									{res.index}
								</button>
							</td>
							<td>
								<span class="error-string">{res.errorString}</span>
							</td>
							<td>
								<span style="">{res.correctionString}</span>
							</td>
							<td>
								<span style="">{res.note}</span>
							</td>
							<td>
								<button
									data-cue-tag={`#cue_${subIndex}-${res.index}`}
									onclick={(e) => {
										scrollIntoView(e);
										applyEdit(e, hintIndex, res.index);
									}}
									disabled={hintList[hintIndex].status}
								>
									{hintList[hintIndex].status ?? 'Apply'}
								</button>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	td {
		padding: 4px 4px;
	}
	tr {
		border-bottom: 1px solid grey;
	}
	table {
		border-collapse: collapse;
		/* border-spacing: 0px; */
	}
	.error-string {
		--color: rgb(237, 147, 147);
		background-color: var(--color);
		/* border-radius: 4px; */
		/* border:1px solid black;  */
		padding: 1px 4px;
		-webkit-box-decoration-break: clone;
		/* box-shadow:
			-0.2em -0.1em 0 var(--color),
			-0.2em 0.1em 0 var(--color),
			0.5em -0.1em 0 var(--color),
			0.5em 0.1em 0 var(--color); */
		filter: url(#goo);
	}
	:global(.custom-model-container) {
		border: 1px solid gray;
		border-radius: 16px;
		padding: 4px;
	}
	/* :global(.grammarly-style-underline) {
		animation: fadeIn 0.3s ease-in;
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	} */
</style>
