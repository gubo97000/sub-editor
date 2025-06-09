// Initialize OpenTelemetry web tracing
import { trace } from '@opentelemetry/api';
import type { HandleClientError } from '@sveltejs/kit';
import './lib/tracing-web.ts';

// Get tracer for client-side operations
const tracer = trace.getTracer('sveltekit-client');

// Handle client-side navigation with tracing
export const handleError: HandleClientError = async ({ error, event, status, message }) => {
	const span = trace.getActiveSpan();
	if (span) {
		span.recordException(error as Error);
		span.setAttributes({
			'error.type': 'client',
			'error.url': event?.url?.href || 'unknown',
			'error.status': status,
		});
	}

	console.error('Client error:', error);
	
	return {
		message: message || 'Something went wrong'
	};
};