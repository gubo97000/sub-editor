// OpenTelemetry utilities for application tracing
import { context, SpanStatusCode, trace, type Span, type Tracer } from '@opentelemetry/api';

// Get tracer instances
const serverTracer: Tracer = trace.getTracer('sub-editor-server');
const clientTracer: Tracer = trace.getTracer('sub-editor-client');

/**
 * Get appropriate tracer based on environment
 */
export function getTracer(): Tracer {
	return typeof window === 'undefined' ? serverTracer : clientTracer;
}

/**
 * Create a traced function wrapper
 */
export function traced<T extends (...args: any[]) => any>(
	name: string, 
	fn: T, 
	attributes: Record<string, string | number | boolean> = {}
): T {
	return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
		const tracer = getTracer();
		return tracer.startActiveSpan(name, async (span: Span) => {
			try {
				// Add custom attributes
				span.setAttributes(attributes);
				
				const result = await fn(...args);
				
				// Mark as successful
				span.setStatus({ code: SpanStatusCode.OK });
				
				return result;
			} catch (error) {
				// Record error
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: (error as Error).message,
				});
				throw error;
			} finally {
				span.end();
			}
		});
	}) as T;
}

/**
 * Add custom attributes to current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
	const span = trace.getActiveSpan();
	if (span) {
		span.setAttributes(attributes);
	}
}

/**
 * Record an event in the current span
 */
export function addSpanEvent(name: string, attributes: Record<string, string | number | boolean> = {}): void {
	const span = trace.getActiveSpan();
	if (span) {
		span.addEvent(name, attributes);
	}
}

/**
 * Create a child span manually
 */
export function createSpan(name: string, attributes: Record<string, string | number | boolean> = {}): Span {
	const tracer = getTracer();
	const span = tracer.startSpan(name);
	span.setAttributes(attributes);
	return span;
}

/**
 * Trace API calls specifically
 */
export function traceApiCall<T extends (...args: any[]) => any>(
	method: string, 
	url: string, 
	fn: T
): T {
	return traced(`API ${method} ${url}`, fn, {
		'http.method': method,
		'http.url': url,
		'operation.type': 'api_call',
	});
}

/**
 * Trace LLM operations
 */
export function traceLLMOperation<T extends (...args: any[]) => any>(
	operation: string, 
	model: string, 
	fn: T
): T {
	return traced(`LLM ${operation}`, fn, {
		'llm.operation': operation,
		'llm.model': model,
		'operation.type': 'llm',
	});
}

/**
 * Trace file operations
 */
export function traceFileOperation<T extends (...args: any[]) => any>(
	operation: string, 
	filename: string, 
	fn: T
): T {
	return traced(`File ${operation}`, fn, {
		'file.operation': operation,
		'file.name': filename,
		'operation.type': 'file',
	});
}

/**
 * Trace subtitle operations
 */
export function traceSubtitleOperation<T extends (...args: any[]) => any>(
	operation: string, 
	fn: T
): T {
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
