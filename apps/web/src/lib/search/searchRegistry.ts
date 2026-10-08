import type { TFunction } from 'i18next';
import { routes } from '../routes';
import { fuzzyMatchScore, highlightFuzzySpans } from './fuzzyScore';

export interface RegistryHit {
  type: 'setting' | 'action';
  id: string;
  title: string;
  description: string;
  route: string;
  keywords: string[];
  adminOnly?: boolean;
  score: number;
  highlightSpans: Array<{ start: number; end: number }>;
}

function buildRegistry(t: TFunction, isAdmin: boolean) {
  const settings: Omit<RegistryHit, 'score' | 'highlightSpans'>[] = [
    {
      type: 'setting',
      id: 'settings-account',
      title: t('search.registry.account'),
      description: t('search.registry.accountDesc'),
      route: routes.settings,
      keywords: ['konto', 'account', 'profil'],
    },
    {
      type: 'setting',
      id: 'settings-extraction',
      title: t('search.registry.extractionEngine'),
      description: t('search.registry.extractionEngineDesc'),
      route: routes.settings,
      keywords: ['ocr', 'extraktion', 'engine'],
    },
    {
      type: 'setting',
      id: 'settings-chat',
      title: t('search.registry.documentChat'),
      description: t('search.registry.documentChatDesc'),
      route: routes.settings,
      keywords: ['chat', 'assistent'],
    },
    {
      type: 'setting',
      id: 'settings-dark',
      title: t('search.registry.darkMode'),
      description: t('search.registry.darkModeDesc'),
      route: routes.settings,
      keywords: ['dunkel', 'dark', 'theme', 'design'],
    },
    {
      type: 'setting',
      id: 'settings-recognized-fields',
      title: t('search.registry.recognizedFields'),
      description: t('search.registry.recognizedFieldsDesc'),
      route: routes.structureRecognizedFields,
      keywords: ['felder', 'fields', 'erkannt'],
    },
    {
      type: 'setting',
      id: 'settings-blocklist',
      title: t('search.registry.blockedLabels'),
      description: t('search.registry.blockedLabelsDesc'),
      route: routes.settings,
      keywords: ['blockiert', 'labels', 'sperre'],
    },
    {
      type: 'setting',
      id: 'settings-connectors',
      title: t('search.registry.connectors'),
      description: t('search.registry.connectorsDesc'),
      route: routes.settingsConnectors,
      keywords: ['connector', 'plugin', 'integration'],
      adminOnly: true,
    },
  ];

  const actions: Omit<RegistryHit, 'score' | 'highlightSpans'>[] = [
    {
      type: 'action',
      id: 'action-new-label',
      title: t('search.registry.newLabel'),
      description: t('search.registry.newLabelDesc'),
      route: routes.structureLabels,
      keywords: ['label', 'tag', 'neu'],
    },
    {
      type: 'action',
      id: 'action-upload',
      title: t('search.registry.upload'),
      description: t('search.registry.uploadDesc'),
      route: routes.documents,
      keywords: ['hochladen', 'upload', 'import'],
    },
    {
      type: 'action',
      id: 'action-new-folder',
      title: t('search.registry.newFolder'),
      description: t('search.registry.newFolderDesc'),
      route: routes.filesystem,
      keywords: ['ordner', 'folder', 'neu'],
    },
  ];

  return [...settings, ...actions].filter((e) => !e.adminOnly || isAdmin);
}

export function searchRegistry(query: string, t: TFunction, isAdmin: boolean): RegistryHit[] {
  const q = query.trim();
  if (!q) return [];
  const entries = buildRegistry(t, isAdmin);
  const scored = entries
    .map((entry) => {
      const score = Math.max(
        fuzzyMatchScore(q, entry.title),
        fuzzyMatchScore(q, entry.description) * 0.95,
        ...entry.keywords.map((k) => fuzzyMatchScore(q, k))
      );
      return {
        ...entry,
        score,
        highlightSpans: highlightFuzzySpans(entry.title, q),
      };
    })
    .filter((e) => e.score >= 0.45)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 8);
}
