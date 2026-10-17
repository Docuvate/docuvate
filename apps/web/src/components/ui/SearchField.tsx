// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface SearchFieldProps {
  placeholder?: string;
  shortcutLabel?: string;
  focused?: boolean;
  className?: string;
  onClick?: () => void;
}

export function SearchField({
  placeholder,
  shortcutLabel,
  focused = false,
  className = '',
  onClick,
}: SearchFieldProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('ui.searchField.placeholder');
  const resolvedShortcut = shortcutLabel ?? t('ui.searchField.shortcut');
  return (
    <button
      type="button"
      className={`search-field${focused ? ' search-field-focus' : ''}${className ? ` ${className}` : ''}`.trim()}
      onClick={onClick}
    >
      <Search size={16} strokeWidth={2} aria-hidden />
      <span className="search-field-placeholder">{resolvedPlaceholder}</span>
      <kbd className="search-field-kbd">{resolvedShortcut}</kbd>
    </button>
  );
}
