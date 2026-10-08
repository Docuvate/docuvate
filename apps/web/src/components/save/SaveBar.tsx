import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

export type SaveBarProps = {
  visible: boolean;
  saving: boolean;
  error?: string | null;
  onSave: () => void;
  onDiscard: () => void;
};

export function SaveBar({ visible, saving, error, onSave, onDiscard }: SaveBarProps) {
  const { t } = useTranslation();

  if (!visible) {
    return null;
  }

  return createPortal(
    <div className="save-bar" role="region" aria-label={t('save.barAria')}>
      <div className="save-bar-inner">
        <p className="save-bar-status" role="status" aria-live="polite">
          {saving ? t('save.saving') : t('save.unsavedHint')}
        </p>
        {error ? (
          <p className="save-bar-error error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="save-bar-actions">
          <Button type="button" variant="secondary" disabled={saving} onClick={onDiscard}>
            {t('save.discard')}
          </Button>
          <Button type="button" variant="primary" disabled={saving} onClick={onSave}>
            {saving ? t('save.saving') : t('save.save')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
