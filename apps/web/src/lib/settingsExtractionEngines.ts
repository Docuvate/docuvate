import type { TFunction } from 'i18next';
import type { ExtractionEngineInfo } from '@docuvate/contracts';
import type { SelectOption } from '../components/ui/Select';
import { extractionEngineLabel } from './extractionEngineI18n';

export function shouldShowExtractionOfflineCallout(
  enginesLoadFailed: boolean,
  engines: ExtractionEngineInfo[],
  selectedEngineId: string,
): boolean {
  if (enginesLoadFailed) {
    return true;
  }
  if (engines.length > 0 && engines.every((engine) => engine.available === false)) {
    return true;
  }
  const selected = engines.find((engine) => engine.id === selectedEngineId);
  return selected?.available === false;
}

export function buildExtractionEngineSelectOptions(
  t: TFunction,
  engines: ExtractionEngineInfo[],
): SelectOption[] {
  if (engines.length === 0) {
    return [
      {
        value: 'pipeline',
        label: extractionEngineLabel(t, 'pipeline', t('settings.engineDefault')),
      },
    ];
  }

  return engines.map((engine) => {
    const unavailable = engine.available === false;
    const baseLabel = extractionEngineLabel(t, engine.id, engine.label);
    return {
      value: engine.id,
      label: baseLabel,
      suffix: unavailable ? t('settings.engineUnavailableShort') : undefined,
      disabled: unavailable,
    };
  });
}
