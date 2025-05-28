import type { CustomOptions } from '$lib/types';
import type Inspect from 'svelte-inspect-value';
import { SvelteMap } from 'svelte/reactivity';

type QueryStatus = 'idle' | 'loading' | 'streaming' | 'completed' | 'error' | 'cancelled';

interface LLMQuery {
	id: string;
	prompt: string;
	status: QueryStatus;
	response: string;
	error?: string;
	timestamp: number;
	abortController?: AbortController;
	customOptions: CustomOptions;
	onComplete: (llmAnswer: string) => void;
}

class LLMQueryManager {
	queries = new SvelteMap<string, LLMQuery>();
	private nextId = 0;

	// Reactive getters
	get allQueries(): LLMQuery[] {
		return Array.from(this.queries.values());
	}

	get activeQueries(): LLMQuery[] {
		return this.allQueries.filter((q) => q.status === 'loading' || q.status === 'streaming');
	}

	getQuery(id: string): LLMQuery | undefined {
		return this.queries.get(id);
	}

	async startQuery(
		data: string[],
		customOptions: CustomOptions,
		onComplete: (llmAnswer: string) => void
	): Promise<string> {
		const id = `query-${++this.nextId}`;
		const abortController = new AbortController();

		const query: LLMQuery = $state({
			id,
			prompt: `Translating ${data.length} cues`,
			status: 'loading',
			response: '',
			timestamp: Date.now(),
			abortController,
			customOptions: JSON.parse(JSON.stringify(customOptions)),
			onComplete: onComplete
		});

		this.queries.set(id, query);

		try {
			const formData = new FormData();
			formData.append('data', JSON.stringify(data));
			//   formData.append('options', JSON.stringify(customOptions));
			formData.append(
				'options',
				JSON.stringify({
					apiUrl: customOptions?.model.endpoint,
					model: customOptions?.model.model,
					apiKey: customOptions?.model.apiKey
					// query: componentPreamble + '\n' + cps.commands + '\n' + customOptions.model.commands
				})
			);

			const response = await fetch('/api/translate-stream', {
				method: 'POST',
				body: formData,
				signal: abortController.signal
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			if (!response.body) {
				throw new Error('No response body available');
			}
			query.status = 'streaming';
			const decoder = new TextDecoder();
			try {
				for await (const chunk of response.body) {
					// console.log(chunk)
					// console.log(decoder.decode(chunk));
					try {
						// console.log(JSON.parse(decoder.decode(chunk)));
						query.response = decoder.decode(chunk);
					} catch (e) {
						console.warn('Failed to parse chunk as JSON');
					}
				}
				query.status = 'completed';
			} catch (e) {
				query.status = 'error';
				console.error('Error reading response body: ', e);
				return id;
			}
			query.abortController = undefined;

			try {
				query.status = 'completed';
				onComplete(query.response);
			} catch (e) {
				console.error('Error in onComplete callback: ', e);
			}
			// this.queries.set(id, { ...query });

			return id;

			// const reader = response.body?.getReader();
			// if (!reader) {
			// 	throw new Error('No response body reader available');
			// }

			// query.status = 'streaming';
			// this.queries.set(id, { ...query });

			// const decoder = new TextDecoder();
			// let buffer = '';

			// try {

			// 	while (true) {
			// 		const { done, value } = await reader.read();
			// 		if (done) break;

			// 		// Append new chunk to buffer
			// 		buffer += decoder.decode(value, { stream: true });
			// 		console.log(decoder.decode(value, { stream: true }));
			// 		// Process complete lines from buffer
			// 		while (true) {
			// 			const lineEnd = buffer.indexOf('\n');
			// 			if (lineEnd === -1) break;

			// 			const line = buffer.slice(0, lineEnd).trim();
			// 			buffer = buffer.slice(lineEnd + 1);

			// 			if (line.startsWith('data: ')) {
			// 				const data = line.slice(6);
			// 				if (data === '[DONE]') {
			// 					query.status = 'completed';
			// 					query.abortController = undefined;
			// 					this.queries.set(id, { ...query });
			// 					return id;
			// 				}

			// 				try {
			// 					const parsed = JSON.parse(data);
			// 					// LangChain structured output chunks contain the translated array
			// 					if (parsed && Array.isArray(parsed)) {
			// 						query.response = JSON.stringify(parsed, null, 2);
			// 					} else if (parsed.error) {
			// 						throw new Error(parsed.error);
			// 					} else {
			// 						// Handle partial chunks or other formats
			// 						query.response = JSON.stringify(parsed, null, 2);
			// 					}
			// 					this.queries.set(id, { ...query });
			// 				} catch (e) {
			// 					// Ignore invalid JSON chunks
			// 					console.warn('Failed to parse SSE data:', data);
			// 				}
			// 			}
			// 		}
			// 	}
			// } finally {
			// 	reader.cancel();
			// }
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				query.status = 'cancelled';
			} else {
				query.status = 'error';
				query.error = error instanceof Error ? error.message : 'Unknown error';
			}
			query.abortController = undefined;
			this.queries.set(id, { ...query });
			return id;
		}
	}

	stopQuery(id: string): boolean {
		const query = this.queries.get(id);
		if (!query || !query.abortController) {
			return false;
		}

		query.abortController.abort();
		return true;
	}

	stopAllQueries(): void {
		for (const query of this.queries.values()) {
			if (query.abortController) {
				query.abortController.abort();
			}
		}
	}

	removeQuery(id: string): boolean {
		const query = this.queries.get(id);
		if (query?.abortController) {
			query.abortController.abort();
		}
		return this.queries.delete(id);
	}

	clearCompletedQueries(): void {
		for (const [id, query] of this.queries.entries()) {
			if (
				query.status === 'completed' ||
				query.status === 'error' ||
				query.status === 'cancelled'
			) {
				this.queries.delete(id);
			}
		}
	}

	clearAllQueries(): void {
		this.stopAllQueries();
		this.queries.clear();
	}
}

// Export singleton instance
export const llmQueryManager = new LLMQueryManager();
