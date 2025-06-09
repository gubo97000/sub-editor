// OpenTelemetry instrumentation setup
import type { Span } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import type { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import type { IncomingMessage } from 'http';

// Environment variables for configuration
const SERVICE_NAME: string = process.env.OTEL_SERVICE_NAME || 'sub-editor';
const SERVICE_VERSION: string = process.env.OTEL_SERVICE_VERSION || '0.0.1';
const JAEGER_ENDPOINT: string = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
const OTLP_ENDPOINT: string = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces';

// Resource configuration
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
  [SEMRESATTRS_SERVICE_VERSION]: SERVICE_VERSION,
});

// Configure exporters
const exporters: SpanExporter[] = [];

// Console exporter for development
if (process.env.NODE_ENV === 'development') {
  exporters.push(new ConsoleSpanExporter());
}

// Jaeger exporter
if (process.env.ENABLE_JAEGER === 'true') {
  exporters.push(new JaegerExporter({
    endpoint: JAEGER_ENDPOINT,
  }));
}

// OTLP HTTP exporter
if (process.env.ENABLE_OTLP === 'true') {
  exporters.push(new OTLPTraceExporter({
    url: OTLP_ENDPOINT,
  }));
}

// Initialize the SDK
const sdk = new NodeSDK({
  resource,
  traceExporter: exporters.length > 0 ? exporters[0] : new ConsoleSpanExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable some instrumentations that might not be needed
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      // Enable HTTP instrumentation for API calls
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        requestHook: (span: Span, request: unknown) => {
          const incomingMessage = request as IncomingMessage;
          if (incomingMessage?.headers?.['user-agent']) {
            span.setAttributes({
              'http.request.header.user-agent': incomingMessage.headers['user-agent'],
            });
          }
        },
      },
      // Enable fetch instrumentation for client-side requests
      '@opentelemetry/instrumentation-undici': {
        enabled: true,
      },
    }),
  ],
});

// Initialize the SDK
sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry terminated'))
    .catch((error: Error) => console.log('Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0));
});

export default sdk;
