// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
const SHOW_MORE_EN = 'Show More';
const SHOW_MORE_DE = 'Mehr anzeigen';

/** English Scalar UI strings that must not appear in the German embed (exact or case variants). */
export const SCALAR_DE_FORBIDDEN_EN_LABELS = [
  'Show More',
  'Show Child Attributes',
  'Hide Child Attributes',
  'Show Schema',
  'Hide Schema',
  'Test Request',
  'required',
  'optional',
  'Copy',
  'Copied',
  'Responses',
  'Operations',
  'No authentication selected',
  'Auth Type',
] as const;

const DE_TEXT_REPLACEMENTS: [string, string][] = [
  ['Show Schema', 'Schema anzeigen'],
  ['Hide Schema', 'Schema ausblenden'],
  ['Show Child Attributes', 'Unterattribute anzeigen'],
  ['Hide Child Attributes', 'Unterattribute ausblenden'],
  ['Responses', 'Antworten'],
  ['Response', 'Antwort'],
  ['Request Body', 'Anfragetext'],
  ['Body', 'Anfragetext'],
  ['Headers', 'Header'],
  ['Parameters', 'Parameter'],
  ['Path Parameters', 'Pfadparameter'],
  ['Query Parameters', 'Abfrageparameter'],
  ['Authentication', 'Authentifizierung'],
  ['Auth Type', 'Authentifizierungstyp'],
  ['No authentication selected', 'Keine Authentifizierung ausgewählt'],
  ['Required', 'Erforderlich'],
  ['required', 'erforderlich'],
  ['Optional', 'Optional'],
  ['optional', 'optional'],
  ['Example', 'Beispiel'],
  ['Examples', 'Beispiele'],
  ['Copy link', 'Link kopieren'],
  ['Copy content', 'Inhalt kopieren'],
  ['Copy', 'Kopieren'],
  ['Copied', 'Kopiert'],
  ['Operations', 'Operationen'],
  ['Operation', 'Operation'],
  ['Show all', 'Alle anzeigen'],
  ['Show More', SHOW_MORE_DE],
  ['No Body', 'Kein Anfragetext'],
];

const ARIA_LABEL_DE: Record<string, string> = {
  'Open Search': 'Suche öffnen',
  Search: 'Suchen',
  'Download OpenAPI Document': 'OpenAPI-Dokument herunterladen',
  'Keyboard Shortcut:': 'Tastenkürzel:',
  Select: 'Auswählen',
  'Show sidebar': 'Seitenleiste anzeigen',
  'Show search': 'Suche anzeigen',
  'Open Group': 'Gruppe öffnen',
  'Close Group': 'Gruppe schließen',
  'Open Menu': 'Menü öffnen',
  'Close Client': 'Client schließen',
  'Open API Documentation for Docuvate API': 'OpenAPI-Dokumentation für die Docuvate API',
  'Sidebar for Docuvate API': 'Seitenleiste für die Docuvate API',
};

function localizeScalarAriaLabel(raw: string): string {
  const trimmed = raw.trim();
  const exact = ARIA_LABEL_DE[trimmed];
  if (exact) return exact;
  if (trimmed.startsWith('Keyboard Shortcut:')) {
    return trimmed.replace('Keyboard Shortcut:', 'Tastenkürzel:');
  }
  if (trimmed.startsWith('HTTP Method:')) {
    return trimmed.replace(/^HTTP Method:/i, 'HTTP-Methode:');
  }
  const selected = /^Selected:\s*(.+),\s*HTTP Method\s+(\w+)/i.exec(trimmed);
  if (selected?.[1] && selected[2]) {
    return `Ausgewählt: ${selected[1]}, HTTP-Methode ${selected[2].toLowerCase()}`;
  }
  if (trimmed.startsWith('HTTP Method ')) {
    return trimmed.replace(/^HTTP Method /i, 'HTTP-Methode ');
  }
  if (trimmed.startsWith('Type:')) {
    return trimmed.replace(/^Type:/, 'Typ:');
  }
  const expand = /^Expand (.+)$/i.exec(trimmed);
  if (expand) return `Gruppe ${expand[1]} ausklappen`;
  const collapse = /^Collapse (.+)$/i.exec(trimmed);
  if (collapse) return `Gruppe ${collapse[1]} einklappen`;
  const showAll = /^Show all (.+) endpoints$/i.exec(trimmed);
  if (showAll) return `Alle ${showAll[1]}-Endpunkte anzeigen`;
  if (/^Example Responses$/i.test(trimmed)) return 'Beispiel-Antworten';
  if (trimmed.includes('Download OpenAPI Document') && trimmed.includes('OpenAPI-Dokument')) {
    return 'OpenAPI-Dokument herunterladen';
  }
  return trimmed;
}

function connectedEl(el: Element): HTMLElement | null {
  return el instanceof HTMLElement && el.isConnected ? el : null;
}

function patchAccessibilityLabels(root: HTMLElement): void {
  root.querySelectorAll('[aria-label]').forEach((el) => {
    const node = connectedEl(el);
    if (!node) return;
    const raw = node.getAttribute('aria-label');
    if (!raw) return;
    const next = localizeScalarAriaLabel(raw);
    if (next !== raw.trim()) node.setAttribute('aria-label', next);
  });

  root
    .querySelectorAll('aside[aria-label], nav[aria-label], [role="complementary"][aria-label]')
    .forEach((el) => {
      const node = connectedEl(el);
      if (!node) return;
      const raw = node.getAttribute('aria-label');
      if (!raw) return;
      const next = localizeScalarAriaLabel(raw);
      if (next !== raw.trim()) node.setAttribute('aria-label', next);
    });

  root.querySelectorAll('ul[aria-label], nav[aria-label]').forEach((el) => {
    const node = connectedEl(el);
    if (!node) return;
    const raw = node.getAttribute('aria-label');
    if (!raw) return;
    const endpoints = /^(.+) endpoints$/i.exec(raw.trim());
    if (endpoints) node.setAttribute('aria-label', `${endpoints[1]}-Endpunkte`);
  });

  root.querySelectorAll('.sidebar-search input, input[placeholder]').forEach((el) => {
    if (!(el instanceof HTMLInputElement)) return;
    const ph = el.getAttribute('placeholder');
    if (ph === 'Search' || ph === 'Search…') {
      el.setAttribute('placeholder', 'Suchen');
    }
  });

  root.querySelectorAll('[title]').forEach((el) => {
    const raw = el.getAttribute('title');
    if (!raw) return;
    const next = localizeScalarAriaLabel(raw);
    if (next !== raw.trim()) el.setAttribute('title', next);
  });

  root.querySelectorAll('.sr-only, .screenreader-only').forEach((el) => {
    const t = el.textContent?.trim();
    if (!t) return;
    let next = localizeScalarAriaLabel(t);
    if (next.includes('(Collapsed)') || next.includes('(Eingeklappt)')) {
      next = next.replaceAll(' (Collapsed)', '').replaceAll(' (Eingeklappt)', '');
    }
    if (next.includes('Copy link')) {
      next = next.replaceAll('Copy link', 'Link kopieren');
    }
    if (next !== t) el.textContent = next;
  });
}

function isOperationChromeElement(el: Element): boolean {
  return Boolean(
    el.closest(
      'button.schema-card-title, button.schema-properties, .request-body, .responses, .response-card, .operation-details, .section-header, .parameter-item, .authentication-section'
    )
  );
}

function shouldSkipTextMutationNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest('.endpoint-path, .endpoint-method, code, pre, .hljs')) return true;
  if (parent.closest('nav.sidebar-pages')) return true;
  if (parent.closest('.tag-section-container')) {
    if (parent.closest('button.show-more')) return false;
    if (isOperationChromeElement(parent)) return false;
    return true;
  }
  if (parent.closest('.sidebar-heading, .sidebar-heading-link-title')) return true;
  return false;
}

function replaceExactText(node: Text, replacements: [string, string][]): void {
  const raw = node.textContent ?? '';
  const trimmed = raw.trim();
  if (!trimmed) return;
  for (const [en, de] of replacements) {
    if (trimmed === en) {
      node.textContent = raw.replace(trimmed, de);
      return;
    }
  }
}

function patchSafeGermanText(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node instanceof Text && !shouldSkipTextMutationNode(node)) {
      replaceExactText(node, DE_TEXT_REPLACEMENTS);
    }
    node = walker.nextNode();
  }
}

function patchEndpointPathBreaks(root: HTMLElement): void {
  root.querySelectorAll('.endpoint-path').forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    if (el.dataset.pathWbr === '1') return;
    const text = el.textContent?.trim();
    if (!text || !text.includes('/')) return;
    el.dataset.pathWbr = '1';
    el.textContent = '';
    el.style.overflowWrap = 'normal';
    el.style.wordBreak = 'normal';
    const parts = text.split('/');
    if (text.startsWith('/')) {
      el.appendChild(document.createTextNode('/'));
      parts.shift();
    }
    parts.forEach((segment, index) => {
      if (index > 0) {
        el.appendChild(document.createElement('wbr'));
        el.appendChild(document.createTextNode('/'));
      }
      el.appendChild(document.createTextNode(segment));
    });
  });
}

function patchTagSectionLeafUILabels(root: HTMLElement): void {
  root.querySelectorAll('.tag-section-container *').forEach((el) => {
    if (el.childElementCount > 0) return;
    if (el.closest('.endpoint-path, code, pre, .hljs, .label, .anchor, .anchor-copy')) return;
    el.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        replaceExactText(child as Text, DE_TEXT_REPLACEMENTS);
      }
    });
  });
}

function patchTagSectionPermalinkChrome(root: HTMLElement): void {
  root.querySelectorAll('.tag-section-container .screenreader-only').forEach((el) => {
    const t = el.textContent ?? '';
    if (!t) return;
    let next = t;
    if (next.includes('(Collapsed)') || next.includes('(Eingeklappt)')) {
      next = next.replaceAll(' (Collapsed)', '').replaceAll(' (Eingeklappt)', '');
    }
    if (next.includes('Copy link')) {
      next = next.replaceAll('Copy link', 'Link kopieren');
    }
    if (next !== t) el.textContent = next;
  });

  root
    .querySelectorAll('.tag-section-container .anchor-copy, .tag-section-container .anchor')
    .forEach((el) => {
      const t = el.textContent ?? '';
      if (t.includes('Copy link')) {
        el.textContent = t.replaceAll('Copy link', 'Link kopieren');
      }
    });

  root.querySelectorAll('.tag-section-container .label').forEach((el) => {
    const t = el.textContent ?? '';
    if (t.includes('Copy link') || t.includes('(Collapsed)')) {
      el.textContent = t
        .replaceAll('Copy link', 'Link kopieren')
        .replaceAll(' (Collapsed)', '')
        .replaceAll(' (Eingeklappt)', '');
    }
  });

  root.querySelectorAll('.tag-section-container .copy-button').forEach((el) => {
    el.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE && child.textContent?.includes('Copy content')) {
        child.textContent = child.textContent.replaceAll('Copy content', 'Inhalt kopieren');
      }
    });
  });
}

function patchSchemaCardTitles(root: HTMLElement): void {
  root.querySelectorAll('button.schema-card-title, button.schema-properties').forEach((el) => {
    el.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        replaceExactText(child as Text, DE_TEXT_REPLACEMENTS);
      }
    });
  });
}

function patchShowSchemaCheckboxLabels(root: HTMLElement): void {
  root.querySelectorAll('label.scalar-card-checkbox').forEach((label) => {
    if (!(label instanceof HTMLLabelElement)) return;
    label.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        replaceExactText(child as Text, [['Show Schema', 'Schema anzeigen']]);
      }
    });
    const input = label.querySelector('input.scalar-card-checkbox-input');
    if (input instanceof HTMLInputElement && input.isConnected) {
      input.setAttribute('aria-label', 'Schema anzeigen');
    }
  });
}

function patchDownloadButtons(root: HTMLElement): void {
  root
    .querySelectorAll('a.download-button, button.download-button, .download .download-button')
    .forEach((el) => {
      el.setAttribute('aria-label', 'OpenAPI-Dokument herunterladen');
      el.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
          child.textContent = '';
        }
      });
    });
}

export function patchSidebarGroupToggleSrOnly(root: HTMLElement): void {
  root.querySelectorAll('nav.sidebar-pages button[aria-expanded]').forEach((btn) => {
    if (!(btn instanceof HTMLElement)) return;
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const title =
      btn
        .closest('li.sidebar-group-item')
        ?.querySelector('.sidebar-heading-link-title')
        ?.textContent?.trim() ??
      btn.closest('li')?.querySelector('.sidebar-heading-link-title')?.textContent?.trim();
    if (!title) return;
    const sr = btn.querySelector('.sr-only, .screenreader-only');
    if (sr) {
      sr.textContent = expanded ? `Gruppe ${title} einklappen` : `Gruppe ${title} ausklappen`;
    }
  });
}

function patchShowMoreButtons(root: HTMLElement): void {
  root.querySelectorAll('button.show-more').forEach((el) => {
    el.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE && child.textContent?.includes(SHOW_MORE_EN)) {
        child.textContent = child.textContent.replaceAll(SHOW_MORE_EN, SHOW_MORE_DE);
      }
    });
    const aria = el.getAttribute('aria-label');
    if (aria?.includes(SHOW_MORE_EN)) {
      el.setAttribute('aria-label', aria.replaceAll(SHOW_MORE_EN, SHOW_MORE_DE));
    }
  });
}

/** DE chrome patches scoped away from Scalar lazy-render tag sections (except show-more buttons). */
export function patchScalarDeChrome(root: HTMLElement): void {
  patchAccessibilityLabels(root);
  patchSidebarGroupToggleSrOnly(root);
  patchEndpointPathBreaks(root);
  patchTagSectionPermalinkChrome(root);
  patchTagSectionLeafUILabels(root);
  patchSchemaCardTitles(root);
  patchShowSchemaCheckboxLabels(root);
  patchDownloadButtons(root);
  patchShowMoreButtons(root);
  patchSafeGermanText(root);
}

export function observeScalarDeChrome(root: HTMLElement): () => void {
  let debounceTimer = 0;
  let observer: MutationObserver | null = null;

  const run = () => {
    observer?.disconnect();
    patchScalarDeChrome(root);
    observer?.observe(root, { childList: true, subtree: true });
  };

  const schedule = () => {
    if (debounceTimer !== 0) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      debounceTimer = 0;
      run();
    }, 300);
  };

  observer = new MutationObserver(schedule);
  run();

  const onHash = () => schedule();
  window.addEventListener('hashchange', onHash);

  return () => {
    window.removeEventListener('hashchange', onHash);
    observer?.disconnect();
    observer = null;
    if (debounceTimer !== 0) window.clearTimeout(debounceTimer);
  };
}
