// Client-side OpenTelemetry setup for browser
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
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
  try {
    // Resource configuration
    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: 'sub-editor-client',
      [SEMRESATTRS_SERVICE_VERSION]: '0.0.1',
    });

    // Create tracer provider
    const provider = new WebTracerProvider({
      resource,
    });

    // Add span processor
    provider.addSpanProcessor(
      new BatchSpanProcessor(new ConsoleSpanExporter())
    );

    // Register the provider
    provider.register();

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
}

export { };

