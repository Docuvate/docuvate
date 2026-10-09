import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDocumentLayoutTypst } from '../../lib/api';
import { typstExportDegradedMessage } from '../../lib/layoutExportTypst';
import { textFromExtractionBlocks } from '../../lib/extractionLayout';
import type { ExtractionBlock } from '@docuvate/contracts';
import { Button } from '../ui/Button';
import { useToastNotify } from '../save/ToastProvider';

type ExportFormat = 'typst-semantic' | 'typst-exact' | 'markdown';

interface DocumentLayoutExportTabProps {
  documentId: string;
  documentTitle?: string;
  hasLayoutIr: boolean;
  markdown?: string | null;
  blocks: ExtractionBlock[];
}

export function DocumentLayoutExportTab({
  documentId,
  documentTitle,
  hasLayoutIr,
  markdown,
  blocks,
}: DocumentLayoutExportTabProps) {
  const { t } = useTranslation();
  const { pushError, pushSuccess } = useToastNotify();
  const [previewTypst, setPreviewTypst] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const markdownSource = markdown?.trim() ?? '';

  const downloadTypst = useCallback(
    async (mode: 'exakt' | 'semantisch', previewOnly: boolean) => {
      setPreviewLoading(true);
      try {
        const { typst, reconstructionReliable, unreliableReason } = await fetchDocumentLayoutTypst(
          documentId,
          mode
        );
        if (previewOnly) {
          setPreviewTypst(typst);
        } else {
          const blob = new Blob([typst], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const safeTitle = (documentTitle ?? 'document').replace(/[^\wäöüÄÖÜß.-]+/g, '-').slice(0, 80);
          const suffix = mode === 'semantisch' ? '-semantisch' : '-exakt';
          a.download = `${safeTitle}-layout${suffix}.typ`;
          a.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 0);
        }
        if (!reconstructionReliable) {
          pushSuccess(typstExportDegradedMessage(t, unreliableReason));
        }
      } catch {
        pushError(t('documents.layoutExportTypstFailed'));
      } finally {
        setPreviewLoading(false);
      }
    },
    [documentId, documentTitle, pushError, pushSuccess, t]
  );

  const formats = useMemo(
    () =>
      [
        hasLayoutIr
          ? {
              id: 'typst-semantic' as ExportFormat,
              title: t('documents.layoutExportTypstSemantisch'),
              description: t('documents.layoutExportSemanticHint'),
            }
          : null,
        hasLayoutIr
          ? {
              id: 'typst-exact' as ExportFormat,
              title: t('documents.layoutExportTypstExakt'),
              description: t('documents.layoutExportExactHint'),
            }
          : null,
        {
          id: 'markdown' as ExportFormat,
          title: t('documents.layoutExportMarkdown'),
          description: t('documents.layoutExportMarkdownHint'),
        },
      ].filter(Boolean) as {
        id: ExportFormat;
        title: string;
        description: string;
      }[],
    [hasLayoutIr, t]
  );

  async function onSelectFormat(id: ExportFormat) {
    if (id === 'typst-semantic') {
      await downloadTypst('semantisch', true);
      return;
    }
    if (id === 'typst-exact') {
      await downloadTypst('exakt', true);
      return;
    }
    const md = markdownSource || textFromExtractionBlocks(blocks);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(documentTitle ?? 'document').replace(/[^\w.-]+/g, '-')}.md`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="layout-side-export">
      <p className="muted layout-side-export-lead">{t('documents.layoutExportLead')}</p>
      <div className="layout-export-format-grid">
        {formats.map((fmt) => (
          <button
            key={fmt.id}
            type="button"
            className="layout-export-format-card"
            onClick={() => void onSelectFormat(fmt.id)}
          >
            <span className="layout-export-format-title">{fmt.title}</span>
            <span className="muted layout-export-format-desc">{fmt.description}</span>
          </button>
        ))}
      </div>
      {previewTypst ? (
        <div className="layout-export-preview">
          <div className="layout-export-preview-head">
            <span>{t('documents.layoutExportTypstPreview')}</span>
            <Button
              type="button"
              variant="secondary"
              disabled={previewLoading}
              onClick={() => void downloadTypst('semantisch', false)}
            >
              {t('documents.layoutExportDownload')}
            </Button>
          </div>
          <pre className="layout-export-preview-code">{previewTypst}</pre>
        </div>
      ) : null}
    </div>
  );
}
