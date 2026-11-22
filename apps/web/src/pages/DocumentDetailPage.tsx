// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentDto,
  ExtractedField,
  ExtractionBlock,
  FolderDto,
  RecognizedFieldDefinitionDto,
  TagDto,
} from '@docuvate/contracts';
import {
  FIELD_ACCEPTANCE_LABEL_CONFIDENCE,
  normalizeSuggestionDecisionValue,
  parseSuggestionStorageKey,
  semanticFieldKey,
  suggestionRejectIdentityKeys,
} from '@docuvate/contracts';
import { ArrowLeft } from 'lucide-react';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { DocumentDetailLoadingShell } from '../components/documents/DocumentDetailLoadingShell';
import {
  DocumentDetailMetaBar,
  type InspectorPanel,
} from '../components/documents/DocumentDetailMetaBar';
import { DocumentDetailNotFound } from '../components/documents/DocumentDetailNotFound';
import { DocumentExtractionSection } from '../components/documents/DocumentExtractionSection';
import type { LayoutSideTab } from '../components/documents/DocumentLayoutSidePanel';
import { DocumentLayoutWorkspace } from '../components/documents/DocumentLayoutWorkspace';
import { DocumentMetadataForm } from '../components/documents/DocumentMetadataForm';
import { DocumentPreviewCard } from '../components/documents/DocumentPreviewCard';
import { DocumentRibbonGallery } from '../components/documents/DocumentRibbonGallery';
import { DocumentStructuringRibbon } from '../components/documents/DocumentStructuringRibbon';
import { DuplicateCandidatesPanel } from '../components/documents/DuplicateCandidatesPanel';
import { ExtractedFieldsPanel } from '../components/documents/ExtractedFieldsPanel';
import { LabelPanel } from '../components/documents/LabelPanel';
import { LabelPlacementHints } from '../components/documents/LabelPlacementHints';
import { DocumentPipelineHeader, DocumentReviewWorkbench } from '../components/pipeline';
import { PageFormSaveKit } from '../components/save/PageFormSaveKit';
import { useToastNotify } from '../components/save/ToastProvider';
import { RecognizedFieldEditDialog } from '../components/settings/RecognizedFieldEditDialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  applyDocumentFieldCorrection,
  deleteDocument,
  getDocument,
  getUserSettings,
  getWorkspaceMlSettings,
  listDocumentFieldSuggestionDecisions,
  listFolders,
  listRecognizedFields,
  listTags,
  requeueDocumentExtraction,
  updateDocument,
  withdrawDocumentFieldCorrection,
} from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { authClient, authSessionUserId } from '../lib/auth-client';
import {
  isoDateFromExtractedValue,
  pickAutoDocumentDateFromFields,
} from '../lib/documentAutoDocumentDate';
import {
  readCitationPageFromLocationState,
  readHighlightBlocksFromLocationState,
} from '../lib/documentDetailLocationState';
import { isExtractionPending } from '../lib/documentExtractionState';
import { withSavedFieldValue } from '../lib/documentFieldValueRowState';
import { documentStageState } from '../lib/documentPipeline';
import {
  catalogFieldGateContextFromDocument,
  type CatalogFieldGateSettings,
  mergeCatalogFieldsForDocument,
} from '../lib/documentRecognizedCatalogFields';
import { areBlocksDirty, areFieldsDirty, extractionBlocksForUpdate } from '../lib/extractionDirty';
import { extractionFieldLabel } from '../lib/extractionFieldLabels';
import {
  findBlockIndexAtPoint,
  normalizeExtractionBlocks,
  textFromExtractionBlocks,
} from '../lib/extractionLayout';
import {
  type FieldExtractionFeedbackCounts,
  parseFieldExtractionFeedbackCounts,
} from '../lib/fieldExtractionFeedback';
import { humanizeFieldKey } from '../lib/humanizeFieldKey';
import {
  buildCustomFieldDefMap,
  buildGlobalFieldLabelMap,
  parseGlobalFieldKey,
} from '../lib/labelFieldDisplay';
import { flattenCursorPages } from '../lib/pagination/useCursorInfiniteQuery';
import { splitRecognizedFieldsAndSuggestions } from '../lib/recognizedFieldDisplay';
import {
  draftsFromRecognizedDefinitions,
  emptyRecognizedFieldDraft,
  type RecognizedFieldGateDraft,
} from '../lib/recognizedFieldDraft';
import { persistRecognizedFieldCatalog } from '../lib/recognizedFieldsPersist';
import { useDocumentReviewQueueInfiniteQuery } from '../lib/review/useDocumentReviewQueueInfiniteQuery';
import {
  acceptSuggestedField,
  blocksContainingValue,
  confirmFieldKeys,
  nextReviewDocumentId,
  reassignFieldValue,
  releasedSuggestionRejects,
  type SuggestionRejectRef,
} from '../lib/reviewWorkbench';
import { routes } from '../lib/routes';
import { notifySaved, notifySaveError } from '../lib/saveNotify';
import { pushRecentDocument } from '../lib/search/searchRecent';
import type { StructuringAspect } from '../lib/structuringAspects';
import { primaryForAspect, type StructuringCommand, type StructuringPrimary } from '../lib/structuringRibbon';
import { useStructuringPrimary } from '../lib/useStructuringPrimary';
import { useDocumentDetailPlainTextFallback } from './useDocumentDetailPlainTextFallback';
import { useDocumentDetailPreviewBuffer } from './useDocumentDetailPreviewBuffer';

interface DocumentMetadataBaseline {
  title: string;
  documentDate: string;
  notes: string;
  folderId: string;
}

function applyStructuringChrome(
  command: StructuringCommand,
  setLayoutSideTab: (tab: LayoutSideTab) => void
): void {
  if (command.layoutTab) setLayoutSideTab(command.layoutTab);
}

/**
 * Store a field correction and show it on the overview.
 * Layout mode opens the tables tab, and that tab unmounts the field rows that carry the page chip.
 */
function showCorrectedFieldsOnOverview(
  nextFields: ExtractedField[],
  setFields: (fields: ExtractedField[]) => void,
  setLayoutSideTab: (tab: LayoutSideTab) => void
): void {
  setFields(nextFields);
  setLayoutSideTab('fields');
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
  /** Details-only surface (metadata); Felder/Labels live in the ribbon gallery. */
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [layoutSideTab, setLayoutSideTab] = useState<LayoutSideTab>('fields');
  const [positionEditFieldKey, setPositionEditFieldKey] = useState<string | null>(null);
  const [workbenchEditFieldKey, setWorkbenchEditFieldKey] = useState<string | null>(null);
  const [correctionSheetOpen, setCorrectionSheetOpen] = useState(false);
  const [viewerPage, setViewerPage] = useState(1);
  const onViewerPageChange = useCallback((page: number) => {
    startTransition(() => {
      setViewerPage(page);
    });
  }, []);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [suggestionRejects, setSuggestionRejects] = useState<SuggestionRejectRef[]>([]);
  const [blocks, setBlocks] = useState<ExtractionBlock[]>([]);
  const [baselineFields, setBaselineFields] = useState<ExtractedField[]>([]);
  const [baselineBlocks, setBaselineBlocks] = useState<ExtractionBlock[]>([]);
  const [highlightBlocks, setHighlightBlocks] = useState<ExtractionBlock[]>([]);
  const [folderId, setFolderId] = useState('');
  const [requeueBusy, setRequeueBusy] = useState(false);
  const [fieldFeedback, setFieldFeedback] = useState<FieldExtractionFeedbackCounts | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [createFieldOpen, setCreateFieldOpen] = useState(false);
  const [createFieldBusy, setCreateFieldBusy] = useState(false);
  const { pushSuccess } = useToastNotify();
  const [metadataBaseline, setMetadataBaseline] = useState<DocumentMetadataBaseline>({
    title: '',
    documentDate: '',
    notes: '',
    folderId: '',
  });
  const [metadataSaveError, setMetadataSaveError] = useState<string | null>(null);
  const structuring = useStructuringPrimary();
  const layoutPrimaryBootstrapped = useRef(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [recognizedCatalog, setRecognizedCatalog] = useState<RecognizedFieldDefinitionDto[]>([]);
  const [fieldGateSettings, setFieldGateSettings] = useState<CatalogFieldGateSettings>({
    fieldExtractionConfidenceGateEnabled: true,
    labelFieldConfidenceThreshold: FIELD_ACCEPTANCE_LABEL_CONFIDENCE.normal,
    fieldExtractionRequiredLabelIds: [],
  });
  const gateDefaults: RecognizedFieldGateDraft = useMemo(
    () => ({
      confidenceGateEnabled: fieldGateSettings.fieldExtractionConfidenceGateEnabled !== false,
      labelFieldConfidenceThreshold: fieldGateSettings.labelFieldConfidenceThreshold,
    }),
    [fieldGateSettings]
  );
  const [documentDateAuto, setDocumentDateAuto] = useState(false);
  const docRef = useRef<DocumentDto | null>(null);
  const reviewQueue = useDocumentReviewQueueInfiniteQuery();
  const refetchReviewQueue = reviewQueue.refetch;
  const reviewQueueItems = flattenCursorPages(reviewQueue.data?.pages);
  const arrivedForReview = new URLSearchParams(location.search).get('review') === '1';

  useEffect(() => {
    void refetchReviewQueue();
  }, [id, refetchReviewQueue]);

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
  const isPdf = mimeType === 'application/pdf' || doc?.previewAvailable === true;
  const isImage = mimeType?.startsWith('image/') ?? false;

  useEffect(() => {
    if (layoutPrimaryBootstrapped.current || !doc) return;
    if (!(isPdf && doc.extraction?.layoutIrAvailable === true)) return;
    if (structuring.primary !== null) {
      layoutPrimaryBootstrapped.current = true;
      return;
    }
    layoutPrimaryBootstrapped.current = true;
    const bootPrimary = arrivedForReview ? 'fields' : 'layout';
    const command = structuring.select(bootPrimary);
    if (command.layoutTab) setLayoutSideTab(command.layoutTab);
  }, [arrivedForReview, doc, isPdf, structuring]);
  const isPlainText = mimeType === 'text/plain' || (mimeType?.startsWith('text/plain;') ?? false);
  const plainTextFallback = useDocumentDetailPlainTextFallback(
    id,
    isPlainText,
    doc?.extraction?.text
  );

  const load = useCallback(async () => {
    if (!id) return;
    const [loaded, decisions] = await Promise.all([
      getDocument(id),
      listDocumentFieldSuggestionDecisions(id).catch(() => ({ items: [] })),
    ]);
    const prev = docRef.current;
    if (prev && isSameDocumentSnapshot(prev, loaded)) {
      setSuggestionRejects(
        decisions.items.map((item) => ({
          fieldKey: item.fieldKey,
          valueNormalized: item.valueNormalized,
          correctionId: item.correctionId,
          value: item.value,
        }))
      );
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
    setSuggestionRejects(
      decisions.items.map((item) => ({
        fieldKey: item.fieldKey,
        valueNormalized: item.valueNormalized,
        correctionId: item.correctionId,
        value: item.value,
      }))
    );
  }, [id]);

  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam === 'details') {
      setDetailsOpen(true);
      return;
    }
    if (tabParam === 'labels' || tabParam === 'fields') {
      const command = structuring.select(tabParam);
      if (command.layoutTab) setLayoutSideTab(command.layoutTab);
    }
    // Boot from ?tab= once per document id; structuring.select is stable enough for that.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot per id
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      load(),
      listTags(),
      listRecognizedFields(),
      listFolders(),
      getUserSettings(),
      getWorkspaceMlSettings(),
    ])
      .then(([, tagList, recognized, f, settings, workspaceMl]) => {
        if (!active) return;
        setTags(tagList);
        setRecognizedCatalog(recognized);
        setGlobalFieldLabels(buildGlobalFieldLabelMap(recognized));
        setFolders(f);
        setFieldGateSettings({
          fieldExtractionConfidenceGateEnabled:
            settings.fieldExtractionConfidenceGateEnabled !== false,
          labelFieldConfidenceThreshold:
            FIELD_ACCEPTANCE_LABEL_CONFIDENCE[workspaceMl.fieldAcceptance],
          fieldExtractionRequiredLabelIds: settings.fieldExtractionRequiredLabelIds ?? [],
        });
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
  const docPreviewAvailable = doc?.previewAvailable === true;
  const { previewData, previewFetchState } = useDocumentDetailPreviewBuffer(
    id,
    previewMime,
    docPreviewAvailable
  );

  useEffect(() => {
    if (!id || !doc) return undefined;
    const pending =
      ['uploaded', 'queued', 'extracting'].includes(doc.status) ||
      (doc.recognizedFieldAttempts?.some((row) => row.outcome === 'pending') ?? false);
    if (!pending) return undefined;
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 3000);
    return () => {
      window.clearInterval(timer);
    };
  }, [id, doc, load]);

  async function persist(
    patch?: {
      extractionFields?: ExtractedField[];
      extractionBlocks?: ExtractionBlock[];
    },
    options?: { silentSuccess?: boolean }
  ) {
    if (!id) return;
    const fieldsBaselineBeforeSave = baselineFields;
    setSaving(true);
    setError(null);
    try {
      const {
        document: updated,
        fieldCorrectionsRecorded = 0,
        fieldConfirmationsRecorded = 0,
      } = await updateDocument(id, {
        title,
        documentDate: documentDate || null,
        notes: notes || null,
        folderId: folderId || null,
        extractionFields: patch?.extractionFields ?? fields,
        extractionBlocks: extractionBlocksForUpdate(
          patch?.extractionBlocks,
          blocks,
          baselineBlocks
        ),
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
        setFieldFeedback(
          parseFieldExtractionFeedbackCounts(fieldCorrectionsRecorded, fieldConfirmationsRecorded)
        );
      }
      setDoc({
        ...updated,
        extraction: updated.extraction
          ? { ...updated.extraction, blocks: nextBlocks, text: nextText ?? updated.extraction.text }
          : updated.extraction,
      });
      if (patch?.extractionFields !== undefined && !options?.silentSuccess) {
        notifySaved(t('documents.fieldSavedToast'), () => {
          setFields(fieldsBaselineBeforeSave);
          void persist({ extractionFields: fieldsBaselineBeforeSave }, { silentSuccess: true });
        });
      } else if (patch?.extractionBlocks !== undefined && !options?.silentSuccess) {
        notifySaved();
      } else if (
        patch?.extractionFields === undefined &&
        patch?.extractionBlocks === undefined &&
        !options?.silentSuccess
      ) {
        setMetadataBaseline({
          title,
          documentDate,
          notes,
          folderId,
        });
        setMetadataSaveError(null);
        notifySaved();
      } else if (patch?.extractionFields === undefined && patch?.extractionBlocks === undefined) {
        setMetadataBaseline({
          title,
          documentDate,
          notes,
          folderId,
        });
        setMetadataSaveError(null);
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
    if (page) onViewerPageChange(page);
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

  const catalogFieldKeys = useMemo(
    () => new Set(recognizedCatalog.map((def) => def.key)),
    [recognizedCatalog]
  );

  const fieldGateContext = useMemo(
    () => (doc ? catalogFieldGateContextFromDocument(doc, tags) : null),
    [doc, tags]
  );

  const mergedFields = useMemo(() => {
    if (!doc || !fieldGateContext) {
      return fields;
    }
    return mergeCatalogFieldsForDocument(
      fields,
      recognizedCatalog,
      fieldGateContext,
      fieldGateSettings
    );
  }, [doc, fieldGateContext, fieldGateSettings, fields, recognizedCatalog]);

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
    () => splitRecognizedFieldsAndSuggestions(mergedFields, catalogFieldKeys),
    [mergedFields, catalogFieldKeys]
  );

  useEffect(() => {
    if (documentDate.trim() || documentDateAuto) {
      return;
    }
    const pick = pickAutoDocumentDateFromFields(recognizedFields);
    if (!pick) {
      return;
    }
    setDocumentDate(pick.isoDate);
    setDocumentDateAuto(true);
  }, [documentDate, documentDateAuto, recognizedFields]);
  const rejectedSuggestionIdentities = useMemo(() => {
    const set = new Set<string>();
    for (const item of suggestionRejects) {
      for (const key of suggestionRejectIdentityKeys(item.fieldKey)) {
        set.add(`${key}\0${item.valueNormalized}`);
      }
    }
    return set;
  }, [suggestionRejects]);

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
      return [...kept, { key, value, confidence: 0.9, userConfirmed: true }];
    });
    if (key === 'date' || semanticFieldKey({ key, value }) === 'date') {
      const iso = isoDateFromExtractedValue(value);
      if (iso) {
        setDocumentDate(iso);
        setDocumentDateAuto(false);
      }
    }
  }, []);

  function confirmField(field: ExtractedField) {
    const baseline = baselineFields.find((row) => row.key === field.key);
    const previous = fields.find((row) => row.key === field.key) ?? field;
    const nextFields = fields.map((row) =>
      row.key === field.key
        ? { ...row, value: field.value, confidence: 1, userConfirmed: true }
        : row
    );
    setFields(nextFields);
    releaseMatchingSuggestionRejects(field.key, field.value);
    void persist({ extractionFields: nextFields }).then(() => {
      notifySaved(t('documents.fieldConfirmedToast'), () => {
        const restored = fields.map((row) =>
          row.key === field.key
            ? {
                ...row,
                value: baseline?.value ?? previous.value,
                confidence: previous.confidence,
              }
            : row
        );
        setFields(restored);
        void persist({ extractionFields: restored });
      });
    });
  }

  /** Workbench writes save immediately; each offers undo instead of asking first. */
  function saveFieldsWithUndo(nextFields: ExtractedField[], message: string) {
    const previous = fields;
    setFieldFeedback(null);
    setFields(nextFields);
    void persist({ extractionFields: nextFields }).then(() => {
      notifySaved(message, () => {
        setFields(previous);
        void persist({ extractionFields: previous });
      });
    });
  }

  function releaseMatchingSuggestionRejects(fieldKey: string, value: string) {
    if (!id) return;
    const released = releasedSuggestionRejects(suggestionRejects, fieldKey, value);
    if (released.remaining.length === suggestionRejects.length) return;
    setSuggestionRejects(released.remaining);
    for (const correctionId of released.correctionIds) {
      void withdrawDocumentFieldCorrection(id, correctionId).catch(() => undefined);
    }
  }

  function acceptSuggestionAndSave(key: string, value: string) {
    if (key === 'date' || semanticFieldKey({ key, value }) === 'date') {
      const iso = isoDateFromExtractedValue(value);
      if (iso) {
        setDocumentDate(iso);
        setDocumentDateAuto(false);
      }
    }
    releaseMatchingSuggestionRejects(key, value);
    saveFieldsWithUndo(
      acceptSuggestedField(fields, key, value),
      t('documents.fieldConfirmedToast')
    );
  }

  function rejectSuggestionAndSave(key: string, value: string) {
    if (!id) return;
    const valueNormalized = normalizeSuggestionDecisionValue(value);
    const identity = `${key}\0${valueNormalized}`;
    if (
      suggestionRejects.some((item) => `${item.fieldKey}\0${item.valueNormalized}` === identity)
    ) {
      return;
    }
    const correctionId = crypto.randomUUID();
    const optimistic: SuggestionRejectRef = {
      fieldKey: key,
      valueNormalized,
      correctionId,
      value,
    };
    setSuggestionRejects((prev) => [...prev, optimistic]);
    void applyDocumentFieldCorrection(id, {
      id: correctionId,
      op: 'reject_suggestion',
      fieldKey: key,
      valueOverride: value,
    })
      .then((result) => {
        const correction = result?.correction;
        if (result?.noChange && correction) {
          setSuggestionRejects((prev) =>
            prev.map((item) =>
              item.correctionId === correctionId ? { ...item, correctionId: correction.id } : item
            )
          );
        }
        void refetchReviewQueue();
      })
      .catch(() => {
        setSuggestionRejects((prev) => prev.filter((item) => item.correctionId !== correctionId));
      });
  }

  function undoRejectSuggestion(correctionId: string) {
    if (!id) return;
    setSuggestionRejects((prev) => prev.filter((item) => item.correctionId !== correctionId));
    void withdrawDocumentFieldCorrection(id, correctionId)
      .then(() => {
        void refetchReviewQueue();
      })
      .catch(() => {
        void load();
      });
  }

  function locateValue(value: string) {
    const matches = blocksContainingValue(blocks, value);
    if (matches.length > 0) onHighlightBlocks(matches);
  }

  async function refreshDocumentLabels() {
    if (!id) return;
    const refreshed = await getDocument(id);
    setDoc(refreshed);
    void refetchReviewQueue();
  }

  if (loading) return <DocumentDetailLoadingShell />;
  if (error && !doc) {
    return <DocumentDetailNotFound message={error} />;
  }
  if (!doc) {
    return <DocumentDetailNotFound />;
  }

  const previewLoading = previewFetchState === 'loading';
  const previewUnavailable = previewFetchState === 'missing' && !isExtractionPending(doc.status);
  const layoutWorkspace = isPdf && doc.extraction?.layoutIrAvailable === true;
  const stageState = documentStageState(doc);
  const reviewable = stageState === 'review' || stageState === 'structured';
  const applyStructuringSelect = (primary: StructuringPrimary) => {
    if (primary !== 'fields' && primary !== 'labels') {
      setDetailsOpen(false);
    }
    applyStructuringChrome(structuring.select(primary), setLayoutSideTab);
  };
  const applyStructuringAspect = (aspect: StructuringAspect) => {
    applyStructuringSelect(primaryForAspect(aspect));
  };
  const openPanel = (panel: InspectorPanel) => {
    if (panel === 'details') {
      setDetailsOpen(true);
      return;
    }
    applyStructuringSelect(panel === 'labels' ? 'labels' : 'fields');
    if (panel === 'fields') {
      window.requestAnimationFrame(() => {
        document
          .querySelector('.review-workbench')
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  };
  const galleryKind =
    structuring.primary === 'fields'
      ? 'fields'
      : structuring.primary === 'labels'
        ? 'labels'
        : null;
  const nextDocumentId = nextReviewDocumentId(reviewQueueItems, doc.id);
  const fieldTargets = [...new Set([...knownFieldKeys, ...recognizedFields.map((f) => f.key)])]
    .map((key) => ({ key, label: fieldLabelForKey(key) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const ribbonIdentity = layoutWorkspace;

  return (
    <div
      className={`page document-detail-page page--with-save-bar${
        ribbonIdentity ? ' document-detail-page--ribbon-identity' : ''
      }`}
      data-ux="page"
      data-correction-sheet-open={correctionSheetOpen ? '1' : '0'}
    >
      {!ribbonIdentity ? (
        <>
          <p className="document-detail-back">
            <Link to={routes.documents} className="document-detail-back-link">
              <ArrowLeft size={16} strokeWidth={2} aria-hidden />
              {t('documents.breadcrumbDocuments')}
            </Link>
          </p>
          <DocumentDetailMetaBar
            doc={doc}
            onDelete={() => {
              setDeleteDialogOpen(true);
            }}
            onRequeueExtraction={() => void onRequeueExtraction()}
            requeueBusy={requeueBusy}
            showTechnicalDetails={showTechnicalDetails}
            onShowTechnicalDetailsChange={setShowTechnicalDetails}
          />
        </>
      ) : null}

      {stageState === 'review' || stageState === 'structured' ? null : (
        <DocumentPipelineHeader
          doc={doc}
          fields={recognizedFields}
          heuristicSuggestions={heuristicSuggestions}
          rejects={suggestionRejects}
          requeueBusy={requeueBusy}
          onRequeue={() => void onRequeueExtraction()}
          onOpenPanel={openPanel}
        />
      )}

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <DocumentStructuringRibbon
        doc={doc}
        fields={recognizedFields}
        suggestions={heuristicSuggestions}
        rejects={suggestionRejects}
        reviewable={reviewable}
        saving={saving}
        nextDocumentId={nextDocumentId}
        activeAspect={structuring.activeAspect}
        onOpenAspect={applyStructuringAspect}
        onConfirmMany={(keys) => {
          saveFieldsWithUndo(
            confirmFieldKeys(fields, new Set(keys)),
            t('pipeline.workbench.acceptedToast', { count: keys.length })
          );
        }}
        showAspects={layoutWorkspace || reviewable}
        ribbonIdentity={ribbonIdentity}
        onDelete={
          ribbonIdentity
            ? () => {
                setDeleteDialogOpen(true);
              }
            : undefined
        }
        onRequeueExtraction={ribbonIdentity ? () => void onRequeueExtraction() : undefined}
        requeueBusy={requeueBusy}
        showTechnicalDetails={showTechnicalDetails}
        onShowTechnicalDetailsChange={ribbonIdentity ? setShowTechnicalDetails : undefined}
      />

      <DocumentRibbonGallery kind={galleryKind}>
        {galleryKind === 'fields' && reviewable ? (
          <DocumentReviewWorkbench
            doc={doc}
            fields={recognizedFields}
            suggestions={heuristicSuggestions}
            fieldLabelForKey={fieldLabelForKey}
            fieldTargets={fieldTargets}
            saving={saving}
            nextDocumentId={nextDocumentId}
            autoFocusFirst={arrivedForReview}
            onConfirm={(key) => {
              const field = fields.find((row) => row.key === key);
              if (field) confirmField(field);
            }}
            onConfirmMany={(keys) => {
              saveFieldsWithUndo(
                confirmFieldKeys(fields, new Set(keys)),
                t('pipeline.workbench.acceptedToast', { count: keys.length })
              );
            }}
            onSaveValue={(key, value) => {
              releaseMatchingSuggestionRejects(key, value);
              saveFieldsWithUndo(
                withSavedFieldValue(fields, key, value),
                t('pipeline.workbench.correctedToast')
              );
            }}
            onAcceptSuggestion={acceptSuggestionAndSave}
            onRejectSuggestion={rejectSuggestionAndSave}
            rejects={suggestionRejects}
            onUndoReject={undoRejectSuggestion}
            onReassign={(fromKey, toKey) => {
              const source = fields.find((field) => field.key === fromKey);
              if (source) {
                releaseMatchingSuggestionRejects(toKey, source.value);
              }
              saveFieldsWithUndo(
                reassignFieldValue(fields, fromKey, toKey),
                t('pipeline.workbench.reassignedToast', { field: fieldLabelForKey(toKey) })
              );
            }}
            onLocate={locateValue}
            onCorrectPosition={(fieldKey) => {
              setPositionEditFieldKey(fieldKey);
              applyStructuringSelect('layout');
            }}
            onLabelsUpdated={refreshDocumentLabels}
            activeAspect={structuring.activeAspect}
            onOpenAspect={applyStructuringAspect}
            requestEditFieldKey={workbenchEditFieldKey}
            onRequestEditFieldHandled={() => {
              setWorkbenchEditFieldKey(null);
            }}
          />
        ) : null}
        {galleryKind === 'labels' ? (
          <div className="document-ribbon-gallery-labels">
            <LabelPanel document={doc} onUpdated={setDoc} />
            <LabelPlacementHints document={doc} />
          </div>
        ) : null}
      </DocumentRibbonGallery>

      <div className="document-workbench" data-stage-state={stageState} data-inspector="closed">
        <div className="document-workbench-main">
          {detailsOpen ? (
            <div className="document-details-inline detail-tab-panel-surface">
              <DocumentMetadataForm
                doc={doc}
                title={title}
                documentDate={documentDate}
                documentDateAutoFilled={documentDateAuto}
                notes={notes}
                folderId={folderId}
                folders={folders}
                saving={saving}
                onTitleChange={setTitle}
                onDocumentDateChange={(value) => {
                  setDocumentDate(value);
                  setDocumentDateAuto(false);
                }}
                onClearAutoDocumentDate={() => {
                  setDocumentDate('');
                  setDocumentDateAuto(false);
                }}
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
                baselineFields={baselineFields}
                fieldFeedback={fieldFeedback}
                replacedBySheet={correctionSheetOpen}
                onFieldsChange={(next) => {
                  setFieldFeedback(null);
                  setFields(next);
                }}
                onDiscardField={(key) => {
                  const baseline = baselineFields.find((row) => row.key === key);
                  if (!baseline) {
                    return;
                  }
                  setFields((prev) =>
                    prev.map((row) => (row.key === key ? { ...row, value: baseline.value } : row))
                  );
                  notifySaved(t('documents.fieldDiscardedToast'));
                }}
                onConfirmField={confirmField}
                onRequestCorrectField={(field) => {
                  applyStructuringSelect('fields');
                  setWorkbenchEditFieldKey(field.key);
                }}
                onSave={() => void persist({ extractionFields: fields })}
              />
              <DuplicateCandidatesPanel documentId={doc.id} />
            </div>
          ) : null}
          {layoutWorkspace ? (
            <DocumentLayoutWorkspace
              showTechnicalDetails={showTechnicalDetails}
              layoutSideTab={layoutSideTab}
              onLayoutSideTabChange={setLayoutSideTab}
              doc={doc}
              previewData={previewData}
              previewLoading={previewLoading}
              previewUnavailable={previewUnavailable}
              blocks={blocks}
              fields={recognizedFields}
              recognizedCatalog={recognizedCatalog}
              onSaveFieldValue={(key, value) => {
                setFieldFeedback(null);
                const nextFields = withSavedFieldValue(fields, key, value);
                setFields(nextFields);
                void persist({ extractionFields: nextFields });
              }}
              onFieldsChange={(nextFields) => {
                showCorrectedFieldsOnOverview(nextFields, setFields, setLayoutSideTab);
              }}
              heuristicSuggestions={heuristicSuggestions}
              highlightBlocks={highlightBlocks}
              viewerPage={viewerPage}
              activeBlockIndex={activeBlockIndex}
              knownFieldKeys={knownFieldKeys}
              fieldLabelForKey={fieldLabelForKey}
              onViewerPageChange={onViewerPageChange}
              onActiveBlockIndexChange={setActiveBlockIndex}
              onHighlightBlocks={onHighlightBlocks}
              onBlocksChange={setBlocks}
              onAcceptFieldSuggestion={onAcceptFieldSuggestion}
              onRejectFieldSuggestion={rejectSuggestionAndSave}
              rejectedSuggestionIdentities={rejectedSuggestionIdentities}
              requeueBusy={requeueBusy}
              onRequeueExtraction={() => void onRequeueExtraction()}
              textEditOpen={structuring.textOpen}
              onTextEditOpenChange={structuring.onTextOpenChange}
              structuringPrimary={structuring.primary}
              onStructuringPrimaryChange={applyStructuringSelect}
              editMode={structuring.textEditing}
              onEditModeChange={structuring.setTextEditing}
              blocksDirty={blocksDirty}
              saving={saving}
              onSaveBlocks={() => void persist({ extractionBlocks: blocks })}
              onCorrectionSheetOpenChange={setCorrectionSheetOpen}
              positionEditFieldKey={positionEditFieldKey}
              onPositionEditHandled={() => {
                setPositionEditFieldKey(null);
              }}
              onRequestFieldValueEdit={(fieldKey) => {
                applyStructuringSelect('fields');
                setWorkbenchEditFieldKey(fieldKey);
              }}
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
                plainTextPreview={
                  doc.extraction?.text.trim() ? doc.extraction.text : plainTextFallback
                }
                highlightBlocks={highlightBlocks}
                viewerPage={viewerPage}
                onViewerPageChange={onViewerPageChange}
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
                sourceFileMissing={previewUnavailable}
                onViewerPageChange={onViewerPageChange}
                onActiveBlockIndexChange={setActiveBlockIndex}
                onBlocksChange={setBlocks}
                onHighlightBlocks={onHighlightBlocks}
                textCorrection={structuring.primary === 'text'}
                onSaveBlocks={() => void persist({ extractionBlocks: blocks })}
                onExtractionRefresh={load}
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('documents.deleteTitle')}
        description={t('documents.deleteDescription')}
        confirmLabel={t('common.deletePermanently')}
        tone="danger"
        busy={deleteBusy}
        onCancel={() => {
          setDeleteDialogOpen(false);
        }}
        onConfirm={() => void confirmDelete()}
      />

      <RecognizedFieldEditDialog
        open={createFieldOpen}
        mode="create"
        initialRow={emptyRecognizedFieldDraft(gateDefaults)}
        tags={tags}
        gateDefaults={gateDefaults}
        busy={createFieldBusy}
        onCancel={() => {
          setCreateFieldOpen(false);
        }}
        onSave={(row) => {
          void (async () => {
            setCreateFieldBusy(true);
            try {
              const current = draftsFromRecognizedDefinitions(recognizedCatalog, gateDefaults);
              await persistRecognizedFieldCatalog([...current, row], gateDefaults);
              const refreshed = await listRecognizedFields();
              setRecognizedCatalog(refreshed);
              setCreateFieldOpen(false);
              pushSuccess();
              openPanel('fields');
            } catch (err) {
              notifySaveError(formatUserFacingError(err, 'recognizedFields.saveFailed'));
            } finally {
              setCreateFieldBusy(false);
            }
          })();
        }}
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
