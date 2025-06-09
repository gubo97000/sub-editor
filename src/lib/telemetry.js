// OpenTelemetry utilities for application tracing
import { context, SpanStatusCode, trace } from '@opentelemetry/api';

// Get tracer instances
const serverTracer = trace.getTracer('sub-editor-server');
const clientTracer = trace.getTracer('sub-editor-client');

/**
 * Get appropriate tracer based on environment
 */
export function getTracer() {
	return typeof window === 'undefined' ? serverTracer : clientTracer;
}

/**
 * Create a traced function wrapper
 * @param {string} name - Span name
 * @param {Function} fn - Function to trace
 * @param {Object} attributes - Additional span attributes
 */
export function traced(name, fn, attributes = {}) {
	return async (...args) => {
		const tracer = getTracer();
		return tracer.startActiveSpan(name, async (span) => {
			try {
				// Add custom attributes
				span.setAttributes(attributes);
				
				const result = await fn(...args);
				
				// Mark as successful
				span.setStatus({ code: SpanStatusCode.OK });
				
				return result;
			} catch (error) {
				// Record error
				span.recordException(error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: error.message,
				});
				throw error;
			} finally {
				span.end();
			}
		});
	};
}

/**
 * Add custom attributes to current span
 * @param {Object} attributes - Attributes to add
 */
export function addSpanAttributes(attributes) {
	const span = trace.getActiveSpan();
	if (span) {
		span.setAttributes(attributes);
	}
}

/**
 * Record an event in the current span
 * @param {string} name - Event name
 * @param {Object} attributes - Event attributes
 */
export function addSpanEvent(name, attributes = {}) {
	const span = trace.getActiveSpan();
	if (span) {
		span.addEvent(name, attributes);
	}
}

/**
 * Create a child span manually
 * @param {string} name - Span name
 * @param {Object} attributes - Span attributes
 * @returns {Object} Span object
 */
export function createSpan(name, attributes = {}) {
	const tracer = getTracer();
	const span = tracer.startSpan(name);
	span.setAttributes(attributes);
	return span;
}

/**
 * Trace API calls specifically
 * @param {string} method - HTTP method
 * @param {string} url - API URL
 * @param {Function} fn - Function making the API call
 */
export function traceApiCall(method, url, fn) {
	return traced(`API ${method} ${url}`, fn, {
		'http.method': method,
		'http.url': url,
		'operation.type': 'api_call',
	});
}

/**
 * Trace LLM operations
 * @param {string} operation - LLM operation name
 * @param {string} model - Model name
 * @param {Function} fn - Function performing LLM operation
 */
export function traceLLMOperation(operation, model, fn) {
	return traced(`LLM ${operation}`, fn, {
		'llm.operation': operation,
		'llm.model': model,
		'operation.type': 'llm',
	});
}

/**
 * Trace file operations
 * @param {string} operation - File operation name
 * @param {string} filename - File name
 * @param {Function} fn - Function performing file operation
 */
export function traceFileOperation(operation, filename, fn) {
	return traced(`File ${operation}`, fn, {
		'file.operation': operation,
		'file.name': filename,
		'operation.type': 'file',
	});
}

/**
 * Trace subtitle operations
 * @param {string} operation - Subtitle operation name
 * @param {Function} fn - Function performing subtitle operation
 */
export function traceSubtitleOperation(operation, fn) {
	return traced(`Subtitle ${operation}`, fn, {
		'subtitle.operation': operation,
		'operation.type': 'subtitle',
	});
}

export default {
	traced,
	addSpanAttributes,
	addSpanEvent,
	createSpan,
	traceApiCall,
	traceLLMOperation,
	traceFileOperation,
	traceSubtitleOperation,
	getTracer,
};
