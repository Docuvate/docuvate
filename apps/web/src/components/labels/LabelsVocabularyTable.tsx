import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal } from 'lucide-react';
import type { TagDto } from '@docuvate/contracts';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { IconButton } from '../ui/IconButton';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ContextMenu } from '../ui/ContextMenu';
import { describeLabelAutoAssignment } from './labelMatchingSummary';

type Props = {
  tags: TagDto[];
  documentCountByTagId: Record<string, number>;
  loading?: boolean;
  onEdit: (tag: TagDto) => void;
  onDelete: (tagId: string) => void | Promise<void>;
};

function filterLinkForTag(tag: TagDto): string {
  const needsQuotes = /\s/.test(tag.name);
  const token = needsQuotes ? `label:"${tag.name}"` : `label:${tag.name}`;
  return `${routes.documents}?filter=${encodeURIComponent(token)}`;
}

export function LabelsVocabularyTable(props: Props) {
  const { t } = useTranslation();
  const vocabularyTags = props.tags.filter((tag) => !tag.isInbox);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuTagId, setMenuTagId] = useState<string | null>(null);
  const [confirmTag, setConfirmTag] = useState<TagDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);

  const openMenu = (tagId: string, anchor: HTMLButtonElement) => {
    menuAnchorRef.current = anchor;
    setMenuTagId(tagId);
    const rect = anchor.getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setMenuOpen(true);
  };

  const runDelete = useCallback(async () => {
    if (!confirmTag) return;
    setDeleteBusy(true);
    try {
      await props.onDelete(confirmTag.id);
      setConfirmTag(null);
    } finally {
      setDeleteBusy(false);
    }
  }, [confirmTag, props.onDelete]);

  return (
    <Card className="labels-vocabulary-card">
      <h2 className="labels-vocabulary-title">{t('labels.vocabularyTitle')}</h2>
      {props.loading ? <p className="muted">{t('labels.loading')}</p> : null}
      {!props.loading && vocabularyTags.length === 0 ? (
        <p className="muted">{t('labels.emptyHint')}</p>
      ) : null}
      {vocabularyTags.length > 0 ? (
        <div className="labels-vocabulary-scroll">
          <table className="labels-vocabulary-table">
            <thead>
              <tr>
                <th scope="col">{t('labels.vocabularyColName')}</th>
                <th scope="col">{t('labels.vocabularyColDocuments')}</th>
                <th scope="col">{t('labels.matchingAlgorithm')}</th>
                <th scope="col" className="labels-vocabulary-col-actions">
                  {t('labels.vocabularyColActions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {vocabularyTags.map((tag) => {
                const count = props.documentCountByTagId[tag.id] ?? 0;
                return (
                  <tr key={tag.id}>
                    <td>
                      <Chip label={tag.name} variant="assigned" color={tag.color} />
                    </td>
                    <td>
                      {count > 0 ? (
                        <Link to={filterLinkForTag(tag)} className="labels-vocabulary-doc-link">
                          {t('labels.vocabularyDocCount', { count })}
                        </Link>
                      ) : (
                        <span className="muted">{t('labels.vocabularyDocCount', { count: 0 })}</span>
                      )}
                    </td>
                    <td className="labels-vocabulary-auto muted">
                      {describeLabelAutoAssignment(tag, t)}
                    </td>
                    <td className="labels-vocabulary-col-actions">
                      <div className="labels-vocabulary-actions-inner">
                        <Button type="button" variant="secondary" onClick={() => props.onEdit(tag)}>
                          {t('labels.editAction')}
                        </Button>
                        <IconButton
                          icon={MoreHorizontal}
                          label={t('labels.deleteMenuAria', { name: tag.name })}
                          hasPopup="menu"
                          expanded={menuOpen && menuTagId === tag.id}
                          className="labels-overflow-btn"
                          onClick={(e) => openMenu(tag.id, e.currentTarget)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      <ContextMenu
        open={menuOpen && menuTagId != null}
        x={menuPos.x}
        y={menuPos.y}
        anchorRef={menuAnchorRef}
        onClose={() => setMenuOpen(false)}
        items={[
          {
            kind: 'item',
            id: 'delete-label',
            label: t('common.delete'),
            danger: true,
            onSelect: () => {
              const tag = vocabularyTags.find((t) => t.id === menuTagId);
              if (tag) setConfirmTag(tag);
              setMenuOpen(false);
            },
          },
        ]}
      />
      <ConfirmDialog
        open={confirmTag != null}
        title={t('labels.deleteConfirmTitle', { name: confirmTag?.name ?? '' })}
        description={t('labels.deleteConfirmDesc', {
          count: confirmTag ? (props.documentCountByTagId[confirmTag.id] ?? 0) : 0,
        })}
        confirmLabel={t('common.delete')}
        tone="danger"
        busy={deleteBusy}
        onCancel={() => setConfirmTag(null)}
        onConfirm={() => void runDelete()}
      />
    </Card>
  );
}
