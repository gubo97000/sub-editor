// Initialize OpenTelemetry before anything else
import './lib/tracing.ts';

import { context, trace } from '@opentelemetry/api';
import { register } from 'node-network-devtools';

import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';

// Get tracer instance
const tracer = trace.getTracer('sveltekit-server');

export const init: ServerInit = async () => {
	console.info('Server created, registering shutdown hooks');
	const unregister = register();
	process.on('sveltekit:shutdown', async (reason) => {
		console.info('SvelteKit has shutdown because of', reason);

		// Your custom logic for closing app specific resources
		unregister();
	});
};

// Handle function to add tracing to SvelteKit requests
export const handle: Handle = async ({ event, resolve }) => {
	return tracer.startActiveSpan(`${event.request.method} ${event.url.pathname}`, async (span) => {
		// Add request attributes to the span
		span.setAttributes({
			'http.method': event.request.method,
			'http.url': event.url.href,
			'http.route': event.route?.id || 'unknown',
			'http.user_agent': event.request.headers.get('user-agent') || '',
			'sveltekit.route.id': event.route?.id || 'unknown',
		});

		try {
			const response = await resolve(event);
			
			// Add response attributes
			span.setAttributes({
				'http.status_code': response.status,
				'http.response.size': response.headers.get('content-length') || '0',
			});

			// Mark span as successful
			span.setStatus({ code: 1 }); // OK

			return response;
		} catch (error) {
			// Record error in span
			span.recordException(error as Error);
			span.setStatus({ 
				code: 2, // ERROR
				message: (error as Error).message 
			});
			throw error;
		} finally {
			span.end();
		}
	});
};

// Handle server errors with tracing
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const span = trace.getActiveSpan();
	if (span) {
		span.recordException(error as Error);
		span.setAttributes({
			'error.status': status,
			'error.message': message,
		});
	}

	console.error('Server error:', error);
	
	return {
		message: 'Internal Server Error'
	};
};
