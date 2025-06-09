// Client-side OpenTelemetry setup for browser
import { trace } from '@opentelemetry/api';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { BatchSpanProcessor, ConsoleSpanExporter, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// Type declaration for window
declare global {
  interface Window {
    // Add any window properties if needed
  }
}

// Only initialize on client side
if (typeof window !== 'undefined') {
  (async () => {
    try {
      // Dynamically import resourceFromAttributes to handle verbatimModuleSyntax
      const { resourceFromAttributes } = await import('@opentelemetry/resources');
      
      // Resource configuration
      const resource = resourceFromAttributes({
        [SEMRESATTRS_SERVICE_NAME]: 'sub-editor-client',
        [SEMRESATTRS_SERVICE_VERSION]: '0.0.1',
      });

      // Create tracer provider with span processors configured directly
      const provider = new WebTracerProvider({
        resource,
        spanProcessors: [new BatchSpanProcessor(new ConsoleSpanExporter())],
      });

      // Register the provider
      provider.register();

      // Set the global tracer provider
      trace.setGlobalTracerProvider(provider);

      // Register instrumentations
      registerInstrumentations({
        instrumentations: [
          getWebAutoInstrumentations({
            '@opentelemetry/instrumentation-document-load': {
              enabled: true,
            },
            '@opentelemetry/instrumentation-user-interaction': {
              enabled: true,
            },
            '@opentelemetry/instrumentation-fetch': {
              enabled: true,
              propagateTraceHeaderCorsUrls: [
                /^https?:\/\/localhost/,
                /^https?:\/\/.*\.localhost/,
              ],
            },
            '@opentelemetry/instrumentation-xml-http-request': {
              enabled: true,
              propagateTraceHeaderCorsUrls: [
                /^https?:\/\/localhost/,
                /^https?:\/\/.*\.localhost/,
              ],
            },
          }),
        ],
      });

      console.log('OpenTelemetry Web initialized');
    } catch (error) {
      console.error('Failed to initialize OpenTelemetry Web:', error);
    }
  })();
}

export { };
