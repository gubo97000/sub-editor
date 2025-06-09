# OpenTelemetry Setup for SvelteKit Application

This project is instrumented with OpenTelemetry for observability, providing comprehensive tracing capabilities for both server-side and client-side operations.

## ✅ Quick Start

### 1. Environment Setup

Create a `.env.local` file with basic configuration:

```bash
# Basic configuration for development
OTEL_SERVICE_NAME=sub-editor
OTEL_SERVICE_VERSION=0.0.1
NODE_ENV=development
ENABLE_CONSOLE_EXPORTER=true
```

### 2. Test the Integration

Visit the test page to verify everything is working:

1. Start the development server: `npm run dev`
2. Navigate to: `https://localhost:5173/test-telemetry`
3. Click "Run All Tests" to test all instrumentation features
4. Check your browser console for OpenTelemetry traces

## 🧪 Testing the Integration

### Test Page
Visit `/test-telemetry` to run comprehensive tests of all OpenTelemetry features:

- **API Call Tracing**: Tests HTTP request instrumentation
- **LLM Operation Tracing**: Tests AI/ML operation tracing
- **File Operation Tracing**: Tests file processing instrumentation
- **Subtitle Processing**: Tests domain-specific tracing

### Manual Testing
1. Navigate through your application normally
2. Check the browser console for trace outputs
3. If Jaeger is enabled, visit `http://localhost:16686` to see the UI
4. Look for spans with service name "sub-editor" or "sub-editor-client"

### What You Should See
- HTTP requests automatically traced
- Custom operations traced with metadata
- Trace IDs linking related operations
- Performance timing information
- Error tracking and context

## 📋 What's Instrumented

### Server-side (Automatic)
- ✅ HTTP requests and responses
- ✅ SvelteKit request handling
- ✅ Database queries (if using supported ORM)
- ✅ File system operations
- ✅ Network requests

### Client-side (Automatic)
- ✅ Fetch API calls
- ✅ User interactions (clicks, form submissions)
- ✅ Page load performance
- ✅ Navigation events
- ✅ Error tracking

### Custom Instrumentation Available
- ✅ API call tracing (`traceAPICall`)
- ✅ LLM operation tracing (`traceLLMOperation`)
- ✅ File operation tracing (`traceFileOperation`)
- ✅ Subtitle processing tracing (`traceSubtitleOperation`)

## Setup

### 1. Install Dependencies

The necessary OpenTelemetry packages are already included in `package.json`. If you need to install them manually:

```bash
npm install @opentelemetry/api @opentelemetry/auto-instrumentations-node @opentelemetry/auto-instrumentations-web @opentelemetry/sdk-trace-node @opentelemetry/sdk-trace-web @opentelemetry/resources @opentelemetry/semantic-conventions
```

### 2. Configuration

Copy the example configuration file:

```bash
cp otel.env.example .env
```

Edit `.env` to configure your telemetry settings:

- `OTEL_SERVICE_NAME`: Name of your service (default: "sub-editor")
- `OTEL_SERVICE_VERSION`: Version of your service
- `ENABLE_JAEGER`: Set to "true" to enable Jaeger export
- `ENABLE_OTLP`: Set to "true" to enable OTLP export
- `JAEGER_ENDPOINT`: Jaeger collector endpoint
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`: OTLP traces endpoint

### 3. Running with Different Exporters

#### Console Output (Default)
The application will output traces to the console by default in development mode.

#### Jaeger
To use Jaeger for trace visualization:

1. Start Jaeger using Docker:
```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest
```

2. Set environment variables:
```bash
ENABLE_JAEGER=true
```

3. Access Jaeger UI at http://localhost:16686

#### OTLP (OpenTelemetry Protocol)
To use OTLP with a collector like Grafana Tempo or Jaeger:

1. Set environment variables:
```bash
ENABLE_OTLP=true
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://your-collector:4318/v1/traces
```

## Usage

### Automatic Instrumentation

The following are automatically instrumented:

- **Server-side**: HTTP requests, database queries, file operations
- **Client-side**: Fetch requests, user interactions, page loads

### Custom Tracing

Use the telemetry utilities for custom tracing:

```typescript
import { traced, traceApiCall, traceLLMOperation } from '$lib/telemetry';

// Trace any function
const myFunction = traced('my-operation', async () => {
  // Your code here
});

// Trace API calls
const apiCall = traceApiCall('POST', '/api/endpoint', async () => {
  // API call logic
});

// Trace LLM operations
const llmCall = traceLLMOperation('completion', 'gpt-4', async () => {
  // LLM call logic
});
```

### Adding Custom Attributes

```typescript
import { addSpanAttributes, addSpanEvent } from '$lib/telemetry';

// Add custom attributes to the current span
addSpanAttributes({
  'user.id': userId,
  'operation.type': 'subtitle-processing'
});

// Add events to the current span
addSpanEvent('subtitle-processed', {
  'subtitle.count': subtitleCount,
  'processing.duration': processingTime
});
```

## 🚀 Production Deployment

### Environment Variables for Production
```bash
# Required
OTEL_SERVICE_NAME=sub-editor
OTEL_SERVICE_VERSION=1.0.0
NODE_ENV=production

# Choose your exporter
ENABLE_OTLP=true
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://your-observability-backend.com/v1/traces

# Optional: Disable console output
ENABLE_CONSOLE_EXPORTER=false

# Optional: Configure sampling
OTEL_TRACES_SAMPLER=traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1  # Sample 10% of traces
```

### Performance Considerations
- Enable sampling in high-traffic environments
- Use appropriate trace export intervals
- Monitor the observability backend performance
- Consider trace filtering for sensitive operations

## File Structure

- `src/lib/tracing.ts`: Server-side OpenTelemetry setup
- `src/lib/tracing-web.ts`: Client-side OpenTelemetry setup
- `src/lib/telemetry.ts`: Utility functions for custom tracing
- `src/hooks.server.ts`: Server-side SvelteKit hooks with tracing
- `src/hooks.client.ts`: Client-side SvelteKit hooks with tracing

## Troubleshooting

### No Traces Appearing

1. Check that OpenTelemetry is properly initialized in `hooks.server.ts` and `hooks.client.ts`
2. Verify environment variables are set correctly
3. Check console for any OpenTelemetry initialization errors

### Performance Impact

- Tracing adds minimal overhead (~1-5% in most cases)
- Consider disabling detailed instrumentation in production if needed
- Use sampling to reduce trace volume in high-traffic scenarios

### Debugging

Set `OTEL_LOG_LEVEL=debug` to see detailed OpenTelemetry logs.

## Integration Examples

### With Existing Code

For your subtitle editor application, you can trace:

1. **File Operations**:
```typescript
import { traceFileOperation } from '$lib/telemetry';

const loadSubtitles = traceFileOperation('load', filename, async () => {
  // File loading logic
});
```

2. **LLM Operations**:
```typescript
import { traceLLMOperation } from '$lib/telemetry';

const translateText = traceLLMOperation('translate', 'gpt-4', async () => {
  // Translation logic
});
```

3. **API Calls**:
```typescript
import { traceApiCall } from '$lib/telemetry';

const uploadToPanopto = traceApiCall('POST', '/api/panopto', async () => {
  // Upload logic
});
```

This setup provides comprehensive observability for your SvelteKit application, helping you monitor performance, debug issues, and understand user behavior.
