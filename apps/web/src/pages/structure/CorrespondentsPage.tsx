import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatUserFacingError } from '../../lib/apiErrors';
import type { CorrespondentDto } from '@docuvate/contracts';
import { createCorrespondent, deleteCorrespondent, listCorrespondents } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export function CorrespondentsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<CorrespondentDto[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CorrespondentDto | null>(null);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [items, query]);

  const load = useCallback(async () => {
    setItems(await listCorrespondents());
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(formatUserFacingError(err, 'errors.loadFailed'));
    });
  }, [load, t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createCorrespondent({ name: name.trim() });
    setName('');
    await load();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{t('structure.correspondentsTitle')}</h1>
          <p className="muted">{t('structure.correspondentsLead')}</p>
        </div>
      </header>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="search-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('structure.correspondentsSearchPlaceholder')}
          aria-label={t('structure.correspondentsSearchAria')}
        />
      </div>
      <Card>
        {filteredItems.length === 0 && items.length > 0 ? (
          <p className="muted">{t('structure.noResults')}</p>
        ) : null}
        <ul className="settings-list">
          {filteredItems.map((c) => (
            <li key={c.id}>
              <span>{c.name}</span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingDelete(c)}
              >
                {t('common.delete')}
              </Button>
            </li>
          ))}
        </ul>
        <form className="search-row" onSubmit={(e) => void onSubmit(e)}>
          <Input
            placeholder={t('structure.correspondentsNewPlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit">{t('common.create')}</Button>
        </form>
      </Card>

      <ConfirmDialog
        open={pendingDelete != null}
        title={
          pendingDelete
            ? t('structure.correspondentsDeleteConfirm', { name: pendingDelete.name })
            : ''
        }
        description={t('structure.correspondentsDeleteDescription')}
        confirmLabel={t('common.deletePermanently')}
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            void deleteCorrespondent(pendingDelete.id).then(load);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
