// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentExtractionImageDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { documentExtractionImageThumbnailUrl } from '../../lib/api';
import { routes } from '../../lib/routes';

interface DocumentImageProps {
  documentId: string;
  image: DocumentExtractionImageDto;
}

export function DocumentImage({ documentId, image }: DocumentImageProps) {
  const { t } = useTranslation();
  const caption =
    image.caption?.trim() ?? t('documents.documentImageFallbackCaption', { page: image.page });
  const src = documentExtractionImageThumbnailUrl(documentId, image.id);

  return (
    <Link
      to={routes.document(documentId)}
      state={{ citationPage: image.page }}
      className="document-image-card"
    >
      <img
        className="document-image-thumb"
        src={src}
        alt=""
        width={240}
        height={160}
        loading="lazy"
      />
      <p className="document-image-caption">{caption}</p>
    </Link>
  );
}
