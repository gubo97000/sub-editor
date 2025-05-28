<script lang="ts">
	import { llmQueryManager } from '$lib/stores/llmQueries.svelte';

	let prompt = $state('');

	async function handleSubmit() {
		if (!prompt.trim()) return;

		const queryId = await llmQueryManager.startQuery(prompt);
		prompt = ''; // Clear input
	}

	function stopQuery(id: string) {
		llmQueryManager.stopQuery(id);
	}

	function removeQuery(id: string) {
		llmQueryManager.removeQuery(id);
	}
</script>

<div class="llm-interface">
	<div class="queries">
		<div>
			Active Queries ({Array.from(llmQueryManager.queries.values()).length})
			<button onclick={() => llmQueryManager.stopAllQueries()}> Stop All </button>
			<button onclick={() => llmQueryManager.clearCompletedQueries()}> Clear Completed </button>
		</div>

		{#each Array.from(llmQueryManager.queries.values()) as query (query.id)}
			<div class="query" class:active={query.status === 'loading' || query.status === 'streaming'}>
				<div class="query-header">
					<span class="status status-{query.status}">
						{query.status}
					</span>
					{query.prompt}
					{query.customOptions.model.model}
					<div class="actions">
						{#if query.status === 'loading' || query.status === 'streaming'}
							<button onclick={() => stopQuery(query.id)}>Stop</button>
						{/if}
						<button onclick={() => removeQuery(query.id)}>Remove</button>
					</div>
				</div>

				{#if query.response}
					<details>
						<summary>
							Response
							{#if query.status === 'loading' || query.status === 'streaming'}
								<span class="loading-spinner"></span>
							{/if}
						</summary>
						<div class="response">
							<!-- <strong>Response:</strong> -->
							<textarea
								bind:value={query.response}
								rows="3"
								readonly={query.status !== 'completed'}
								placeholder="Response will appear here..."
							></textarea>
						</div>
						{#if query.status === 'completed'}
							<div>
								<button onclick={() => query.onComplete(query.response)}>
									Retry to parse the response
								</button>
							</div>
						{/if}
					</details>
				{/if}

				{#if query.error}
					<div class="error">
						<strong>Error:</strong>
						{query.error}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.llm-interface {
		max-width: 800px;
		padding: 8px;
		width: 100%;
		border-radius: 16px;
		background-color: var(--background-color);
	}

	.query {
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 8px;
		margin-bottom: 16px;
	}

	.query.active {
		border-color: #007acc;
		background-color: #f0f8ff;
	}

	.query-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		/* margin-bottom: 12px; */
	}

	.status {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: bold;
	}

	.status-loading,
	.status-streaming {
		background-color: #fff3cd;
		color: #856404;
	}
	.status-completed {
		background-color: #d4edda;
		color: #155724;
	}
	.status-error {
		background-color: #f8d7da;
		color: #721c24;
	}
	.status-cancelled {
		background-color: #e2e3e5;
		color: #383d41;
	}

	.loading-spinner {
		display: inline-block;
		margin-left: 4px;
		font-family: monospace;
	}

	.loading-spinner::before {
		content: '⠋';
		animation: loading-chars 0.8s infinite steps(10);
	}

	@keyframes loading-chars {
		0% { content: '⠋'; }
		10% { content: '⠙'; }
		20% { content: '⠹'; }
		30% { content: '⠸'; }
		40% { content: '⠼'; }
		50% { content: '⠴'; }
		60% { content: '⠦'; }
		70% { content: '⠧'; }
		80% { content: '⠇'; }
		90% { content: '⠏'; }
	}

	.response textarea {
		white-space: pre-wrap;
		background-color: #f8f9fa;
		/* padding: 12px; */
		border-radius: 4px;
		/* margin-top: 8px; */
		overflow: auto;
		max-height: 200px;
		width: 100%;
	}

	.error {
		color: #dc3545;
		margin-top: 8px;
	}
</style>
