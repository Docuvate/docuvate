// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorSourceScopeDto, ConnectorSourceTreeNodeDto } from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ConnectorSourceScopePickerProps {
  rootLabel: string;
  scope: ConnectorSourceScopeDto;
  onScopeChange: (next: ConnectorSourceScopeDto) => void;
  loadNodes: (parentPath: string) => Promise<ConnectorSourceTreeNodeDto[]>;
  disabled?: boolean;
}

function countSelectedObjects(
  scope: ConnectorSourceScopeDto,
  nodeCounts: Map<string, number | null>
): number | null {
  if (scope.mode === 'all') {
    return null;
  }
  let total = 0;
  let unknown = false;
  for (const path of scope.paths) {
    const count = nodeCounts.get(path);
    if (count == null) {
      unknown = true;
      continue;
    }
    total += count;
  }
  return unknown && total === 0 ? null : total;
}

export function ConnectorSourceScopePicker({
  rootLabel,
  scope,
  onScopeChange,
  loadNodes,
  disabled = false,
}: ConnectorSourceScopePickerProps) {
  const { t } = useTranslation();
  const [rootNodes, setRootNodes] = useState<ConnectorSourceTreeNodeDto[]>([]);
  const [childrenByParent, setChildrenByParent] = useState<Map<string, ConnectorSourceTreeNodeDto[]>>(
    () => new Map()
  );
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const nodeCounts = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const node of rootNodes) {
      map.set(node.path, node.objectCount);
    }
    for (const nodes of childrenByParent.values()) {
      for (const node of nodes) {
        map.set(node.path, node.objectCount);
      }
    }
    return map;
  }, [rootNodes, childrenByParent]);

  const loadRoot = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const nodes = await loadNodes('');
      setRootNodes(nodes);
    } catch {
      setLoadError(t('connectors.sources.loadFailed'));
      setRootNodes([]);
    } finally {
      setLoading(false);
    }
  }, [loadNodes, t]);

  useEffect(() => {
    void loadRoot();
  }, [loadRoot]);

  async function ensureChildren(parentPath: string) {
    if (childrenByParent.has(parentPath)) {
      return;
    }
    const nodes = await loadNodes(parentPath);
    setChildrenByParent((prev) => {
      const next = new Map(prev);
      next.set(parentPath, nodes);
      return next;
    });
  }

  function toggleExpand(node: ConnectorSourceTreeNodeDto) {
    if (!node.hasChildren) {
      return;
    }
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(node.path)) {
        next.delete(node.path);
      } else {
        next.add(node.path);
        void ensureChildren(node.path);
      }
      return next;
    });
  }

  function togglePath(path: string) {
    if (scope.mode === 'all') {
      onScopeChange({ mode: 'selected', paths: [path] });
      return;
    }
    const has = scope.paths.includes(path);
    const nextPaths = has ? scope.paths.filter((p) => p !== path) : [...scope.paths, path];
    if (nextPaths.length === 0) {
      onScopeChange({ mode: 'all', paths: [] });
      return;
    }
    onScopeChange({ mode: 'selected', paths: nextPaths });
  }

  function setAllMode() {
    onScopeChange({ mode: 'all', paths: [] });
  }

  const allSelected = scope.mode === 'all';
  const partialSelected = scope.mode === 'selected' && scope.paths.length > 0;
  const rootChecked: boolean | 'mixed' = allSelected ? true : partialSelected ? 'mixed' : false;

  const objectTotal = countSelectedObjects(scope, nodeCounts);

  function renderNode(node: ConnectorSourceTreeNodeDto, depth: number) {
    const checked = scope.mode === 'selected' && scope.paths.includes(node.path);
    const isExpanded = expanded.has(node.path);
    const childNodes = childrenByParent.get(node.path) ?? [];
    return (
      <div key={node.path} className="connector-source-tree-branch">
        <div
          className="connector-source-tree-row"
          style={{ paddingInlineStart: `${String(depth * 1.5)}rem` }}
        >
          {node.hasChildren ? (
            <button
              type="button"
              className="connector-source-tree-expand"
              aria-expanded={isExpanded}
              disabled={disabled}
              onClick={() => { toggleExpand(node); }}
            >
              {isExpanded ? '−' : '+'}
            </button>
          ) : (
            <span className="connector-source-tree-expand connector-source-tree-expand--spacer" aria-hidden />
          )}
          <label className="connector-source-tree-label">
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled || allSelected}
              onChange={() => { togglePath(node.path); }}
            />
            <span>{node.label}</span>
          </label>
          {node.objectCount != null ? (
            <span className="connector-source-tree-count">{node.objectCount}</span>
          ) : (
            <span className="connector-source-tree-count connector-source-tree-count--placeholder" aria-hidden>
              0
            </span>
          )}
        </div>
        {isExpanded
          ? childNodes.map((child) => renderNode(child, depth + 1))
          : null}
      </div>
    );
  }

  return (
    <div className="connector-source-scope-picker">
      <div className="connector-source-tree connector-source-tree--scroll">
        <label className="connector-source-tree-row connector-source-tree-row--root">
          <input
            type="checkbox"
            checked={rootChecked === true}
            ref={(el) => {
              if (el) {
                el.indeterminate = rootChecked === 'mixed';
              }
            }}
            disabled={disabled}
            onChange={() => { setAllMode(); }}
            aria-checked={rootChecked === 'mixed' ? 'mixed' : rootChecked ? 'true' : 'false'}
          />
          <span>{rootLabel}</span>
        </label>
        {loading ? (
          <p className="connector-source-tree-status muted" aria-busy="true">
            {t('connectors.sources.loading')}
          </p>
        ) : null}
        {loadError ? (
          <p className="connector-source-tree-status error" role="alert">
            {loadError}
          </p>
        ) : null}
        {!loading && !loadError ? rootNodes.map((node) => renderNode(node, 0)) : null}
      </div>
      <p className="connector-source-summary muted">
        {scope.mode === 'all'
          ? t('connectors.sources.summaryAll')
          : t('connectors.sources.summarySelected', { count: scope.paths.length })}
        {objectTotal != null && scope.mode === 'selected'
          ? ` · ${t('connectors.sources.summaryObjects', { count: objectTotal })}`
          : null}
        {scope.mode === 'selected' ? ` · ${t('connectors.sources.subfoldersHint')}` : null}
      </p>
    </div>
  );
}
