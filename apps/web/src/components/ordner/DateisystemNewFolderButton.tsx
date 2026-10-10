// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FolderPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAutofocusOnMount } from '../../lib/useAutofocusOnMount';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface DateisystemNewFolderButtonProps {
  onCreate: (name: string) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DateisystemNewFolderButton({
  onCreate,
  open: openProp,
  onOpenChange,
}: DateisystemNewFolderButtonProps) {
  const { t } = useTranslation();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const nameInputRef = useAutofocusOnMount<HTMLInputElement>();

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        data-dateisystem-new-folder-trigger
        onClick={() => { setOpen(true); }}
      >
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
        ref={nameInputRef}
        value={name}
        onChange={(e) => { setName(e.target.value); }}
        placeholder={t('filesystem.folderNamePlaceholder')}
        aria-label={t('filesystem.newRootAria')}
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
      <Button type="button" variant="ghost" onClick={() => { setOpen(false); }}>
        {t('common.cancel')}
      </Button>
    </form>
  );
}
