import { workerApiUrl } from '../../worker/worker-api-path.js';
import type {
  DocumentChatInput,
  DocumentChatProvider,
  DocumentChatResult,
} from '../chat-provider.types.js';

export class WorkerDocumentChatProvider implements DocumentChatProvider {
  readonly id: 'context' | 'donut-ml';

  constructor(id: 'context' | 'donut-ml') {
    this.id = id;
  }

  private workerHeaders(): Record<string, string> {
    const secret = process.env['WORKER_SECRET'] ?? 'worker-shared-secret';
    return {
      'Content-Type': 'application/json',
      'X-Worker-Secret': secret,
    };
  }

  private workerUrl(): string {
    return process.env['WORKER_URL'] ?? 'http://localhost:8000';
  }

  async chat(input: DocumentChatInput): Promise<DocumentChatResult> {
    const trimmed = input.message.trim();
    if (!trimmed) {
      return {
        configured: true,
        provider: this.id,
        reply: { role: 'assistant', content: 'Bitte eine Frage zum Dokument stellen.' },
      };
    }

    const body: Record<string, unknown> = {
      provider: this.id,
      message: trimmed,
      title: input.context.title,
      filename: input.context.filename,
      text: input.context.text,
      fields: input.context.fields.map((f) => ({ key: f.key, value: f.value })),
    };

    if (this.id === 'donut-ml' && input.file) {
      body['mime_type'] = input.file.mimeType;
      body['content_base64'] = input.file.buffer.toString('base64');
    }

    let response: Response;
    try {
      response = await fetch(workerApiUrl(this.workerUrl(), '/document-chat'), {
        method: 'POST',
        headers: this.workerHeaders(),
        body: JSON.stringify(body),
      });
    } catch {
      return {
        configured: false,
        provider: this.id,
        setupHint:
          'Der Extraktions-Worker ist nicht erreichbar. Administrator: WORKER_URL und Worker-Dienst prüfen.',
        reply: {
          role: 'assistant',
          content:
            'Der Dokument-Chat ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.',
        },
      };
    }

    if (!response.ok) {
      return {
        configured: false,
        provider: this.id,
        reply: {
          role: 'assistant',
          content:
            'Der Dokument-Chat konnte Ihre Frage gerade nicht beantworten. Bitte in Kürze erneut versuchen.',
        },
      };
    }

    const data = (await response.json()) as {
      reply: string;
      configured: boolean;
      provider: string;
    };

    const setupHint =
      this.id === 'donut-ml' && !data.configured
        ? 'Donut DocVQA ist auf diesem System nicht eingerichtet. Unter Einstellungen „Kontext (Embeddings)“ wählen oder Donut beim Administrator anfragen.'
        : undefined;

    return {
      configured: data.configured,
      provider: this.id,
      setupHint,
      reply: { role: 'assistant', content: data.reply },
    };
  }
}
