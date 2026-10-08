import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface DateisystemNewFolderButtonProps {
  onCreate: (name: string) => Promise<void>;
}

export function DateisystemNewFolderButton({ onCreate }: DateisystemNewFolderButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <FolderPlus size={16} strokeWidth={2} aria-hidden />
        {t('filesystem.newRootButton')}
      </Button>
    );
  }

  async function submitNewFolder(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onCreate(trimmed);
      setName('');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="dateisystem-toolbar-new-folder" onSubmit={(e) => void submitNewFolder(e)}>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('filesystem.folderNamePlaceholder')}
        aria-label={t('filesystem.newRootAria')}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            setName('');
          }
        }}
      />
      <Button type="submit" disabled={busy || !name.trim()}>
        {t('common.create')}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        {t('common.cancel')}
      </Button>
    </form>
  );
}
