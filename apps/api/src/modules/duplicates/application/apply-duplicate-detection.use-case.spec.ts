import { describe, expect, it, vi } from 'vitest';
import { ApplyDuplicateDetectionUseCase } from './apply-duplicate-detection.use-case.js';
import type {
  DocumentRepository,
  DuplicateRepository,
  LabelEmbeddingRepository,
} from '../../../shared/domain/ports.js';
import { LinkDuplicatePairUseCase } from './duplicate-stack.use-cases.js';
import type { DuplicateStackRepository } from '../../../shared/domain/ports.js';

describe('ApplyDuplicateDetectionUseCase', () => {
  it('still links hash-identical documents regardless of year metadata', async () => {
    const documents = {
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: 'JA 2025.pdf',
        title: 'JA 2025',
        extraction: { text: 'Jahresabschluss 2025', fields: [] },
      }),
    } as unknown as DocumentRepository;
    const duplicates = {
      findDocumentIdsByHash: vi.fn().mockResolvedValue(['doc-old']),
      upsertCandidate: vi.fn(),
      listDocumentEmbeddings: vi.fn().mockResolvedValue([]),
    } as unknown as DuplicateRepository;
    const embeddings = {
      getDocumentEmbedding: vi.fn().mockResolvedValue([1, 0]),
    } as unknown as LabelEmbeddingRepository;
    const stacks = { linkPair: vi.fn() } as unknown as DuplicateStackRepository;
    const linkDuplicatePair = new LinkDuplicatePairUseCase(stacks, {
      isPairDismissed: vi.fn().mockResolvedValue(false),
    } as unknown as DuplicateRepository);

    const useCase = new ApplyDuplicateDetectionUseCase(
      documents,
      duplicates,
      embeddings,
      linkDuplicatePair
    );

    await useCase.execute('doc-new', 'user-1', 'same-hash');

    expect(duplicates.upsertCandidate).toHaveBeenCalledWith(
      'user-1',
      'doc-new',
      'doc-old',
      1,
      'hash'
    );
    expect(stacks.linkPair).toHaveBeenCalledWith('user-1', 'doc-new', 'doc-old');
  });

  it('does not upsert embedding candidates blocked by reporting-year gates', async () => {
    const documents = {
      findByIdForUser: vi.fn().mockResolvedValue({
        id: 'doc-new',
        filename: '774128 - JA Auswertungen 2025.pdf',
        title: 'JA Auswertungen 2025',
        extraction: {
          text: 'JAHRESABSCHLUSS zum 31. Dezember 2025',
          fields: [],
          blocks: [{ page: 12, x: 0, y: 0, width: 1, height: 1, text: 'x' }],
        },
      }),
    } as unknown as DocumentRepository;
    const duplicates = {
      findDocumentIdsByHash: vi.fn().mockResolvedValue([]),
      upsertCandidate: vi.fn(),
      listDocumentEmbeddings: vi.fn().mockResolvedValue([
        {
          documentId: 'doc-2024',
          embedding: [1, 0],
          filename: '655536 - JA Auswertungen HR 2024.pdf',
          title: 'JA Auswertungen HR 2024',
          documentDate: null,
          extractedText: 'Bilanz zum 31.12.2024',
          extractedFields: {
            blocks: [{ page: 11, x: 0, y: 0, width: 1, height: 1, text: 'y' }],
          },
        },
      ]),
    } as unknown as DuplicateRepository;
    const embeddings = {
      getDocumentEmbedding: vi.fn().mockResolvedValue([0.99, 0.01]),
    } as unknown as LabelEmbeddingRepository;
    const stacks = { linkPair: vi.fn() } as unknown as DuplicateStackRepository;
    const linkDuplicatePair = new LinkDuplicatePairUseCase(stacks, {
      isPairDismissed: vi.fn().mockResolvedValue(false),
    } as unknown as DuplicateRepository);

    const useCase = new ApplyDuplicateDetectionUseCase(
      documents,
      duplicates,
      embeddings,
      linkDuplicatePair
    );

    await useCase.execute('doc-new', 'user-1', null);

    expect(duplicates.upsertCandidate).not.toHaveBeenCalled();
    expect(stacks.linkPair).not.toHaveBeenCalled();
  });
});
