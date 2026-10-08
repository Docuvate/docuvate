export type ApiErrorBody = {
  code: string;
  message: string;
};

export class DocuvateApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'DocuvateApiError';
    this.status = status;
    this.code = body.code;
  }
}

export class DocuvateNetworkError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'DocuvateNetworkError';
  }
}

export async function parseApiError(response: Response): Promise<DocuvateApiError> {
  let body: ApiErrorBody = { code: 'HTTP_ERROR', message: response.statusText };
  try {
    const json = (await response.json()) as Partial<ApiErrorBody>;
    if (json.code && json.message) {
      body = { code: json.code, message: json.message };
    }
  } catch {
    // ignore
  }
  return new DocuvateApiError(response.status, body);
}
