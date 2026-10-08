export interface ConnectorImportableItem {
  ref: string;
  title: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

export interface ConnectorImportedBlob {
  ref: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ConnectorExportInput {
  documentId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  /** Optional destination hint (S3 key, Paperless title prefix, …). */
  destinationRef?: string;
}

export interface ConnectorExportResult {
  ref: string;
}
