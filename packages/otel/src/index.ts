import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export interface InitOtelOptions {
  serviceName: string;
  environment?: string;
}

let sdk: NodeSDK | undefined;

export function initOtel(options: InitOtelOptions): void {
  if (sdk) {
    return;
  }

  if (process.env['OTEL_SDK_DISABLED'] === 'true') {
    return;
  }

  const endpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
  const traceExporter = endpoint
    ? new OTLPTraceExporter({ url: `${endpoint.replace(/\/$/, '')}/v1/traces` })
    : undefined;

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: options.serviceName,
      'deployment.environment': options.environment ?? process.env['NODE_ENV'] ?? 'development',
    }),
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  const shutdown = () => {
    void sdk?.shutdown();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
