import type { ConnectorConfigurationInput } from './connector.types.js';
import type {
  ConnectorExportInput,
  ConnectorExportResult,
  ConnectorImportableItem,
  ConnectorImportedBlob,
} from './connector-runtime.types.js';

export interface ConnectorSourcePort {
  listImportables(options: { limit: number }): Promise<ConnectorImportableItem[]>;
  fetchImportable(ref: string): Promise<ConnectorImportedBlob>;
}

export interface ConnectorSinkPort {
  exportDocument(input: ConnectorExportInput): Promise<ConnectorExportResult>;
}

export interface ConnectorRuntimePorts {
  source?: ConnectorSourcePort;
  sink?: ConnectorSinkPort;
}

export interface ConnectorRuntimeFactory {
  openRuntime(credentials: ConnectorConfigurationInput): ConnectorRuntimePorts;
}
