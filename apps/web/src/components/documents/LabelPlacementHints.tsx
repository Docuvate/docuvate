// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, FolderDto, MappeDto } from '@docuvate/contracts';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { listFolders, listMappen } from '../../lib/api';
import { routes } from '../../lib/routes';

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function LabelPlacementHints({ document }: { document: DocumentDto }) {
  const { t } = useTranslation();
  const [mappen, setMappen] = useState<MappeDto[]>([]);
  const [folders, setFolders] = useState<FolderDto[]>([]);

  useEffect(() => {
    void Promise.all([listMappen(), listFolders()])
      .then(([m, f]) => {
        setMappen(m);
        setFolders(f);
      })
      .catch(() => undefined);
  }, []);

  const hints = useMemo(() => {
    const labelSet = new Set(
      (document.tags ?? []).filter((tag) => !tag.isInbox).map((tag) => normalizeName(tag.name))
    );
    if (labelSet.size === 0) return [];

    const mappeHits = mappen.filter((m) => labelSet.has(normalizeName(m.name)));
    const folderHits = folders.filter((f) => labelSet.has(normalizeName(f.name)));

    return [
      ...mappeHits.map((m) => ({
        key: `mappe-${m.id}`,
        label: t('documents.labelPlacementMappe', { name: m.name }),
        to: routes.filesystemContainer(m.id),
      })),
      ...folderHits.slice(0, 3).map((f) => ({
        key: `folder-${f.id}`,
        label: t('documents.labelPlacementFolder', { name: f.name }),
        to: routes.filesystemFolder(f.id),
      })),
    ].slice(0, 4);
  }, [document.tags, folders, mappen, t]);

  if (hints.length === 0) return null;

  return (
    <div className="label-placement-hints">
      <p className="muted label-placement-title">{t('documents.labelPlacementTitle')}</p>
      <ul>
        {hints.map((hint) => (
          <li key={hint.key}>
            <Link to={hint.to}>{hint.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
