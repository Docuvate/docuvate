// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentDto,
  ExtractedField,
  ExtractionBlock,
  FolderDto,
  TagDto,
} from '@docuvate/contracts';
import { parseSuggestionStorageKey } from '@docuvate/contracts';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { DocumentChatPanel } from '../components/documents/DocumentChatPanel';
import { DocumentDetailLoadingShell } from '../components/documents/DocumentDetailLoadingShell';
import {
  DocumentDetailMetaBar,
  DocumentDetailTabStrip,
} from '../components/documents/DocumentDetailMetaBar';
import { DocumentExtractionSection } from '../components/documents/DocumentExtractionSection';
import { DocumentLayoutWorkspace } from '../components/documents/DocumentLayoutWorkspace';
import { DocumentMetadataForm } from '../components/documents/DocumentMetadataForm';
import { DocumentPreviewCard } from '../components/documents/DocumentPreviewCard';
import { DuplicateCandidatesPanel } from '../components/documents/DuplicateCandidatesPanel';
import { ExtractedFieldsPanel } from '../components/documents/ExtractedFieldsPanel';
import { LabelPanel } from '../components/documents/LabelPanel';
import { LabelPlacementHints } from '../components/documents/LabelPlacementHints';
import { PageFormSaveKit } from '../components/save/PageFormSaveKit';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  deleteDocument,
  fetchDocumentContentBlob,
  getDocument,
  getUserSettings,
  listFolders,
  listRecognizedFields,
  listTags,
  requeueDocumentExtraction,
  updateDocument,
} from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { authClient, authSessionUserId } from '../lib/auth-client';
import {
  readCitationPageFromLocationState,
  readHighlightBlocksFromLocationState,
} from '../lib/documentDetailLocationState';
import { isExtractionPending } from '../lib/documentExtractionState';
import { fetchDocumentPreviewBuffer } from '../lib/documentPreviewCache';
import { areBlocksDirty, areFieldsDirty } from '../lib/extractionDirty';
import { extractionFieldLabel } from '../lib/extractionFieldLabels';
import {
  findBlockIndexAtPoint,
  normalizeExtractionBlocks,
  textFromExtractionBlocks,
} from '../lib/extractionLayout';
import { humanizeFieldKey } from '../lib/humanizeFieldKey';
import {
  buildCustomFieldDefMap,
  buildGlobalFieldLabelMap,
  parseGlobalFieldKey,
} from '../lib/labelFieldDisplay';
import { splitRecognizedFieldsAndSuggestions } from '../lib/recognizedFieldDisplay';
import { routes } from '../lib/routes';
import { notifySaved, notifySaveError } from '../lib/saveNotify';
import { pushRecentDocument } from '../lib/search/searchRecent';

type DetailTab = 'details' | 'labels' | 'chat';

interface DocumentMetadataBaseline {
  title: string;
  documentDate: string;
  notes: string;
  folderId: string;
}

function metadataFromDocument(doc: DocumentDto): DocumentMetadataBaseline {
  return {
    title: doc.title,
    documentDate: doc.documentDate ?? '',
    notes: doc.notes ?? '',
    folderId: doc.folderId ?? '',
  };
}

function isSameDocumentSnapshot(a: DocumentDto, b: DocumentDto): boolean {
  return (
    a.id === b.id &&
    a.status === b.status &&
    a.updatedAt === b.updatedAt &&
    a.extraction?.text === b.extraction?.text &&
    a.mimeType === b.mimeType
  );
}

export function DocumentDetailPage() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [doc, setDoc] = useState<DocumentDto | null>(null);
  const [folders, setFolders] = useState<FolderDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [globalFieldLabels, setGlobalFieldLabels] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState<ArrayBuffer | null>(null);
  const [previewFetchState, setPreviewFetchState] = useState<
    'idle' | 'loading' | 'ready' | 'missing'
  >('idle');
  const [activeTab, setActiveTab] = useState<DetailTab | null>(null);
  const [viewerPage, setViewerPage] = useState(1);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [blocks, setBlocks] = useState<ExtractionBlock[]>([]);
  const [baselineFields, setBaselineFields] = useState<ExtractedField[]>([]);
  const [baselineBlocks, setBaselineBlocks] = useState<ExtractionBlock[]>([]);
  const [highlightBlocks, setHighlightBlocks] = useState<ExtractionBlock[]>([]);
  const [folderId, setFolderId] = useState('');
  const [requeueBusy, setRequeueBusy] = useState(false);
  const [documentChatAvailable, setDocumentChatAvailable] = useState(false);
  const [fieldFeedbackRecorded, setFieldFeedbackRecorded] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [metadataBaseline, setMetadataBaseline] = useState<DocumentMetadataBaseline>({
    title: '',
    documentDate: '',
    notes: '',
    folderId: '',
  });
  const [metadataSaveError, setMetadataSaveError] = useState<string | null>(null);
  const [layoutTextEditOpen, setLayoutTextEditOpen] = useState(false);
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const docRef = useRef<DocumentDto | null>(null);

  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  useEffect(() => {
    const fromState = readHighlightBlocksFromLocationState(location.state);
    if (fromState) {
      setHighlightBlocks(fromState);
      return;
    }
    const citationPage = readCitationPageFromLocationState(location.state);
    if (citationPage != null) {
      setHighlightBlocks((prev) =>
        prev.length > 0 ? prev : blocks.filter((b) => b.page === citationPage)
      );
    }
  }, [location.state, blocks]);

  useEffect(() => {
    const userId = authSessionUserId(session);
    if (userId && doc) {
      pushRecentDocument(userId, { id: doc.id, title: doc.title || doc.filename });
    }
  }, [session, doc]);

  const mimeType = doc?.mimeType;
  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType?.startsWith('image/') ?? false;
  const isPlainText =
    mimeType === 'text/plain' || (mimeType?.startsWith('text/plain;') ?? false);

  const load = useCallback(async () => {
    if (!id) return;
    const loaded = await getDocument(id);
    const prev = docRef.current;
    if (prev && isSameDocumentSnapshot(prev, loaded)) {
      return;
    }
    setDoc(loaded);
    setTitle(loaded.title);
    setDocumentDate(loaded.documentDate ?? '');
    setNotes(loaded.notes ?? '');
    const nextFields = loaded.extraction?.fields ?? [];
    const nextBlocks = normalizeExtractionBlocks(loaded.extraction?.blocks ?? []);
    setFields(nextFields);
    setBlocks(nextBlocks);
    setBaselineFields(nextFields);
    setBaselineBlocks(nextBlocks);
    setFolderId(loaded.folderId ?? '');
    setMetadataBaseline(metadataFromDocument(loaded));
  }, [id]);

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam === 'details' || tabParam === 'labels' || tabParam === 'chat') {
      setActiveTab(tabParam);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([load(), listTags(), listRecognizedFields(), listFolders(), getUserSettings()])
      .then(([, tagList, recognized, f, settings]) => {
        if (!active) return;
        setTags(tagList);
        setGlobalFieldLabels(buildGlobalFieldLabelMap(recognized));
        setFolders(f);
        setDocumentChatAvailable(settings.documentChatAvailable === true);
      })
      .catch((err: unknown) => {
        if (active) setError(formatUserFacingError(err, 'errors.loadFailed'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, load]);

  useEffect(() => {
    setViewerPage(1);
    setHighlightBlocks([]);
    setActiveBlockIndex(null);
  }, [id]);

  const previewMime = doc?.mimeType;

  useEffect(() => {
    if (!id || !previewMime) {
      setPreviewFetchState('idle');
      return undefined;
    }
    const wantsPdf = previewMime === 'application/pdf';
    const wantsImage = previewMime.startsWith('image/');
    if (!wantsPdf && !wantsImage) {
      setPreviewFetchState('idle');
      return undefined;
    }

    let cancelled = false;
    setPreviewFetchState('loading');
    setPreviewData(null);
    void fetchDocumentPreviewBuffer(id, () => fetchDocumentContentBlob(id))
      .then((buffer) => {
        if (cancelled) return;
        if (buffer.byteLength > 0) {
          setPreviewData(buffer);
          setPreviewFetchState('ready');
        } else {
          setPreviewData(null);
          setPreviewFetchState('missing');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewData(null);
          setPreviewFetchState('missing');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, previewMime]);

  useEffect(() => {
    if (!id || !doc) return undefined;
    const pending = ['uploaded', 'queued', 'extracting'].includes(doc.status);
    if (!pending) return undefined;
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 3000);
    return () => { window.clearInterval(timer); };
  }, [id, doc, load]);

  async function persist(patch?: {
    extractionFields?: ExtractedField[];
    extractionBlocks?: ExtractionBlock[];
  }) {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const { document: updated, fieldCorrectionsRecorded = 0 } = await updateDocument(id, {
        title,
        documentDate: documentDate || null,
        notes: notes || null,
        folderId: folderId || null,
        extractionFields: patch?.extractionFields ?? fields,
        extractionBlocks: patch?.extractionBlocks ?? blocks,
      });
      const nextFields = patch?.extractionFields ?? fields;
      const nextBlocks = patch?.extractionBlocks ?? blocks;
      const nextText =
        patch?.extractionBlocks !== undefined
          ? textFromExtractionBlocks(nextBlocks)
          : updated.extraction?.text;
      setBaselineFields(nextFields);
      setBaselineBlocks(nextBlocks);
      if (patch?.extractionFields !== undefined) {
        setFieldFeedbackRecorded(fieldCorrectionsRecorded);
      }
      setDoc({
        ...updated,
        extraction: updated.extraction
          ? { ...updated.extraction, blocks: nextBlocks, text: nextText ?? updated.extraction.text }
          : updated.extraction,
      });
      if (patch?.extractionFields !== undefined || patch?.extractionBlocks !== undefined) {
        notifySaved();
      } else {
        setMetadataBaseline({
          title,
          documentDate,
          notes,
          folderId,
        });
        setMetadataSaveError(null);
        notifySaved();
      }
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.saveFailed');
      setError(message);
      if (patch?.extractionFields === undefined && patch?.extractionBlocks === undefined) {
        setMetadataSaveError(message);
        notifySaveError(message, () => void persist());
      } else {
        notifySaveError(message, () => void persist(patch));
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveMetadata() {
    await persist();
  }

  function discardMetadata() {
    setTitle(metadataBaseline.title);
    setDocumentDate(metadataBaseline.documentDate);
    setNotes(metadataBaseline.notes);
    setFolderId(metadataBaseline.folderId);
    setMetadataSaveError(null);
  }

  async function confirmDelete() {
    if (!id) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteDocument(id);
      setDeleteDialogOpen(false);
      navigate(routes.documents);
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.deleteFailed'));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function onRequeueExtraction() {
    if (!id) return;
    setRequeueBusy(true);
    setError(null);
    try {
      await requeueDocumentExtraction(id);
      await load();
    } catch (err) {
      setError(formatUserFacingError(err, 'documents.reprocessFailed'));
    } finally {
      setRequeueBusy(false);
    }
  }

  function onHighlightBlocks(next: ExtractionBlock[]) {
    setHighlightBlocks(next);
    const page = next[0]?.page;
    if (page) setViewerPage(page);
  }

  function onPdfPageClick(page: number, nx: number, ny: number) {
    const index = findBlockIndexAtPoint(blocks, page, nx, ny);
    if (index < 0) return;
    setActiveBlockIndex(index);
    onHighlightBlocks([blocks[index]]);
  }

  const blocksDirty = areBlocksDirty(blocks, baselineBlocks);
  const fieldsDirty = areFieldsDirty(fields, baselineFields);
  const metadataDirty = useMemo(
    () =>
      title !== metadataBaseline.title ||
      documentDate !== metadataBaseline.documentDate ||
      notes !== metadataBaseline.notes ||
      folderId !== metadataBaseline.folderId,
    [title, documentDate, notes, folderId, metadataBaseline]
  );

  const catalogFieldKeys = useMemo(() => new Set(globalFieldLabels.keys()), [globalFieldLabels]);

  const knownFieldKeys = useMemo(() => {
    const keys = new Set<string>(catalogFieldKeys);
    for (const tag of tags) {
      for (const def of tag.customFields ?? []) {
        keys.add(def.key);
      }
    }
    return keys;
  }, [tags, catalogFieldKeys]);

  const { recognizedFields, heuristicSuggestions } = useMemo(
    () => splitRecognizedFieldsAndSuggestions(fields, catalogFieldKeys),
    [fields, catalogFieldKeys]
  );

  const fieldLabelForKey = useCallback(
    (key: string) => {
      const globalKey = parseGlobalFieldKey(key);
      if (globalKey) {
        return globalFieldLabels.get(globalKey) ?? extractionFieldLabel(globalKey);
      }
      const fromCatalog = globalFieldLabels.get(key);
      if (fromCatalog) return fromCatalog;
      const localized = extractionFieldLabel(key);
      if (localized !== key) return localized;
      return humanizeFieldKey(key, t);
    },
    [globalFieldLabels, t]
  );

  const onAcceptFieldSuggestion = useCallback((key: string, value: string) => {
    setFields((prev) => {
      const kept = prev.filter((f) => {
        const suggestionSemantic = parseSuggestionStorageKey(f.key);
        return suggestionSemantic !== key && f.key !== key;
      });
      if (kept.some((f) => f.key === key)) return prev;
      return [...kept, { key, value, confidence: 0.9 }];
    });
  }, []);

  if (loading) return <DocumentDetailLoadingShell />;
  if (error && !doc)
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  if (!doc) return <p className="error">{t('documents.notFound')}</p>;

  const previewLoading = previewFetchState === 'loading';
  const previewUnavailable = previewFetchState === 'missing' && !isExtractionPending(doc.status);
  const layoutWorkspace = isPdf && doc.extraction?.layoutIrAvailable === true;

  return (
    <div className="page document-detail-page page--with-save-bar" data-ux="page">
      <p className="document-detail-back">
        <Link to={routes.documents} className="document-detail-back-link">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          {t('documents.breadcrumbDocuments')}
        </Link>
      </p>

      <DocumentDetailMetaBar doc={doc} onDelete={() => { setDeleteDialogOpen(true); }} />

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="document-detail-tab-region">
        <DocumentDetailTabStrip
          activeTab={activeTab}
          labelCount={doc.tags.length}
          onTabChange={setActiveTab}
        />
        {activeTab === 'details' ? (
          <div
            className="detail-tab-panel-surface"
            role="tabpanel"
            aria-label={t('documents.tabDetails')}
          >
            <DocumentMetadataForm
              title={title}
              documentDate={documentDate}
              notes={notes}
              folderId={folderId}
              folders={folders}
              saving={saving}
              onTitleChange={setTitle}
              onDocumentDateChange={setDocumentDate}
              onNotesChange={setNotes}
              onFolderIdChange={setFolderId}
            />
            <ExtractedFieldsPanel
              fields={recognizedFields}
              heuristicSuggestions={heuristicSuggestions}
              onAcceptSuggestion={onAcceptFieldSuggestion}
              tags={tags}
              customFieldDefs={buildCustomFieldDefMap(tags)}
              globalFieldLabels={globalFieldLabels}
              saving={saving}
              fieldsDirty={fieldsDirty}
              feedbackRecordedCount={fieldFeedbackRecorded}
              onFieldsChange={(next) => {
                setFieldFeedbackRecorded(0);
                setFields(next);
              }}
              onSave={() => void persist({ extractionFields: fields })}
            />
            <DuplicateCandidatesPanel documentId={doc.id} />
          </div>
        ) : null}

        {activeTab === 'labels' ? (
          <div
            className="detail-tab-panel-surface"
            role="tabpanel"
            aria-label={t('documents.tabLabels')}
          >
            <LabelPanel document={doc} onUpdated={setDoc} />
            <LabelPlacementHints document={doc} />
          </div>
        ) : null}

        {activeTab === 'chat' && !layoutWorkspace ? (
          <div
            className="detail-tab-panel-surface"
            role="tabpanel"
            aria-label={t('documents.tabChat')}
          >
            <DocumentChatPanel documentId={doc.id} compact chatAvailable={documentChatAvailable} />
          </div>
        ) : null}
      </div>

      {layoutWorkspace ? (
        <DocumentLayoutWorkspace
          chatSidePanel={activeTab === 'chat'}
          documentChatAvailable={documentChatAvailable}
          doc={doc}
          previewData={previewData}
          previewLoading={previewLoading}
          previewUnavailable={previewUnavailable}
          blocks={blocks}
          fields={recognizedFields}
          heuristicSuggestions={heuristicSuggestions}
          highlightBlocks={highlightBlocks}
          viewerPage={viewerPage}
          activeBlockIndex={activeBlockIndex}
          knownFieldKeys={knownFieldKeys}
          fieldLabelForKey={fieldLabelForKey}
          onViewerPageChange={setViewerPage}
          onActiveBlockIndexChange={setActiveBlockIndex}
          onHighlightBlocks={onHighlightBlocks}
          onBlocksChange={setBlocks}
          onAcceptFieldSuggestion={onAcceptFieldSuggestion}
          requeueBusy={requeueBusy}
          onRequeueExtraction={() => void onRequeueExtraction()}
          textEditOpen={layoutTextEditOpen}
          onTextEditOpenChange={setLayoutTextEditOpen}
          editMode={layoutEditMode}
          onEditModeChange={setLayoutEditMode}
          blocksDirty={blocksDirty}
          saving={saving}
          onSaveBlocks={() => void persist({ extractionBlocks: blocks })}
        />
      ) : (
        <div className="detail-workspace">
          <DocumentPreviewCard
            doc={doc}
            previewData={previewData}
            previewLoading={previewLoading}
            previewUnavailable={previewUnavailable}
            isPdf={isPdf}
            isImage={isImage}
            isPlainText={isPlainText}
            plainTextPreview={doc.extraction?.text ?? null}
            highlightBlocks={highlightBlocks}
            viewerPage={viewerPage}
            onViewerPageChange={setViewerPage}
            fitWidth={isPdf}
            title={t('documents.previewTitle')}
            onPageClick={isPdf && blocks.length > 0 ? onPdfPageClick : undefined}
          />
          <DocumentExtractionSection
            doc={doc}
            blocks={blocks}
            saving={saving}
            blocksDirty={blocksDirty}
            viewerPage={viewerPage}
            activeBlockIndex={activeBlockIndex}
            requeueBusy={requeueBusy}
            onRequeueExtraction={() => void onRequeueExtraction()}
            onViewerPageChange={setViewerPage}
            onActiveBlockIndexChange={setActiveBlockIndex}
            onBlocksChange={setBlocks}
            onHighlightBlocks={onHighlightBlocks}
            onSaveBlocks={() => void persist({ extractionBlocks: blocks })}
            onExtractionRefresh={load}
          />
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('documents.deleteTitle')}
        description={t('documents.deleteDescription')}
        confirmLabel={t('common.deletePermanently')}
        tone="danger"
        busy={deleteBusy}
        onCancel={() => { setDeleteDialogOpen(false); }}
        onConfirm={() => void confirmDelete()}
      />

      <PageFormSaveKit
        dirty={metadataDirty}
        saving={saving}
        error={metadataSaveError}
        onDiscard={discardMetadata}
        onSave={() => void saveMetadata()}
      />
    </div>
  );
}
