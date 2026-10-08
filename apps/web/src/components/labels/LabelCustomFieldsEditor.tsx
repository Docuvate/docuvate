import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomFieldType, TagCustomFieldDefinitionDto } from '@docuvate/contracts';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export type CustomFieldDraft = {
  key: string;
  label: string;
  fieldType: CustomFieldType;
};

interface LabelCustomFieldsEditorProps {
  fields: CustomFieldDraft[];
  saving: boolean;
  onChange: (fields: CustomFieldDraft[]) => void;
  onSave: () => void;
}

export function draftsFromDefinitions(defs: TagCustomFieldDefinitionDto[]): CustomFieldDraft[] {
  return defs.map((d) => ({
    key: d.key,
    label: d.label,
    fieldType: d.fieldType,
  }));
}

export function LabelCustomFieldsEditor({
  fields,
  saving,
  onChange,
  onSave,
}: LabelCustomFieldsEditorProps) {
  const { t } = useTranslation();
  const fieldTypes = useMemo(
    (): { value: CustomFieldType; label: string }[] => [
      { value: 'text', label: t('labelCustomFields.typeText') },
      { value: 'date', label: t('labelCustomFields.typeDate') },
      { value: 'number', label: t('labelCustomFields.typeNumber') },
      { value: 'currency', label: t('labelCustomFields.typeCurrency') },
    ],
    [t]
  );

  function updateRow(index: number, patch: Partial<CustomFieldDraft>) {
    onChange(fields.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...fields, { key: '', label: '', fieldType: 'text' }]);
  }

  return (
    <div className="label-custom-fields-editor stack">
      <p className="muted label-custom-fields-hint">{t('labelCustomFields.extractHint')}</p>
      {fields.length === 0 ? (
        <p className="muted">{t('labelCustomFields.empty')}</p>
      ) : (
        <ul className="label-custom-fields-list">
          {fields.map((row, index) => (
            <li key={index} className="label-custom-fields-row">
              <label>
                {t('labelCustomFields.columnLabel')}
                <Input
                  value={row.label}
                  placeholder={t('labelCustomFields.labelPlaceholder')}
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                />
              </label>
              <label>
                {t('labelCustomFields.columnKey')}
                <Input
                  value={row.key}
                  placeholder={t('labelCustomFields.keyPlaceholder')}
                  onChange={(e) => updateRow(index, { key: e.target.value })}
                />
              </label>
              <label>
                {t('labelCustomFields.columnType')}
                <Select
                  value={row.fieldType}
                  onChange={(value) => updateRow(index, { fieldType: value as CustomFieldType })}
                  options={fieldTypes.map((opt) => ({ value: opt.value, label: opt.label }))}
                  aria-label={t('labelCustomFields.fieldTypeAria')}
                />
              </label>
              <Button type="button" variant="ghost" onClick={() => removeRow(index)}>
                {t('labelCustomFields.remove')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={addRow}>
          {t('labelCustomFields.addField')}
        </Button>
        <Button type="button" disabled={saving} onClick={onSave}>
          {saving ? t('documents.saving') : t('labelCustomFields.saveFields')}
        </Button>
      </div>
    </div>
  );
}
