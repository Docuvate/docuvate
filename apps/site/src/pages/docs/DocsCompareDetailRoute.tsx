// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useParams } from 'react-router-dom';
import { DocsCompareDetailPage } from '../DocsCompareDetailPage';

export function DocsCompareDetailRoute() {
  const { slug } = useParams();
  return <DocsCompareDetailPage slug={slug ?? ''} />;
}
