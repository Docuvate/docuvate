// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { familyDesign,TABLE_FAMILIES, type TableFamily } from '../../../lib/tableLayouts';
import { MenuItem } from '../../ui/MenuItem';
import { Menu, MenuContent, MenuTrigger } from '../../ui/overlay/Menu';
import { TableFamilyThumbnail } from './TableFamilyThumbnail';

interface TableFamilyMenuProps {
  value: TableFamily;
  onChange: (family: TableFamily) => void;
}

export function TableFamilyMenu({ value, onChange }: TableFamilyMenuProps) {
  const { t } = useTranslation();
  return (
    <Menu>
      <MenuTrigger
        className="table-tool-select table-family-menu-trigger"
        aria-label={t('tableLayouts.template')}
        data-testid="table-family-menu"
      >
        <TableFamilyThumbnail
          family={value}
          title={t(`tableLayouts.families.${value}`)}
          hint={t(`tableLayouts.familyHints.${value}`)}
        />
        <ChevronDown size={14} aria-hidden />
      </MenuTrigger>
      <MenuContent className="popover-surface table-family-menu" align="start">
        <div
          className="table-family-menu-scroll"
          role="listbox"
          aria-label={t('tableLayouts.template')}
        >
          {TABLE_FAMILIES.map((family) => (
            <MenuItem
              key={family}
              role="option"
              aria-selected={family === value}
              variant={family === value ? 'active' : 'default'}
              className="table-family-item"
              label={
                <TableFamilyThumbnail
                  family={family}
                  title={t(`tableLayouts.families.${family}`)}
                  hint={t(`tableLayouts.familyHints.${family}`)}
                />
              }
              onClick={() => {
                onChange(family);
                void familyDesign(family);
              }}
            />
          ))}
        </div>
      </MenuContent>
    </Menu>
  );
}
