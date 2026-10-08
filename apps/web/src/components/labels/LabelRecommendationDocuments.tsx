import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import type { LabelRecommendationDocumentPreviewDto } from '@docuvate/contracts';
import { routes } from '../../lib/routes';
import {
  recommendationDocumentTitle,
  shouldShowRecommendationFilename,
} from './labelRecDocumentDisplay';

const MAX_VISIBLE = 3;

type Props = {
  documents: LabelRecommendationDocumentPreviewDto[];
};

export function LabelRecommendationDocuments({ documents }: Props) {
  const { t } = useTranslation();
  if (documents.length === 0) {
    return null;
  }

  const visible = documents.slice(0, MAX_VISIBLE);
  const overflow = documents.length - visible.length;

  return (
    <ul className="label-rec-doc-list">
      {visible.map((doc) => (
        <li key={doc.id} className="label-rec-doc-row">
          <FileText size={14} aria-hidden className="label-rec-doc-icon" />
          <Link to={routes.document(doc.id)} className="label-rec-doc-link">
            {recommendationDocumentTitle(doc)}
          </Link>
          {shouldShowRecommendationFilename(doc) ? (
            <span className="label-rec-doc-filename muted">{doc.filename}</span>
          ) : null}
        </li>
      ))}
      {overflow > 0 ? (
        <li className="label-rec-doc-more muted">
          {t('labelRecommendations.moreDocuments', { count: overflow })}
        </li>
      ) : null}
    </ul>
  );
}
