// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type {
  AuthorizationAction,
  AuthorizationDecision,
  AuthorizationPort,
  AuthorizationRequest,
  AuthorizationSubject,
} from '../../domain/authorization.js';

const ACTION_CLAIM: Record<AuthorizationAction, string> = {
  'document:read': 'document:read',
  'document:list': 'document:list',
  'document:write': 'document:write',
  'document:delete': 'document:delete',
  'document:content:read': 'document:content:read',
  'document:chat': 'document:chat',
};

function parseDeniedStatuses(): Set<string> {
  const raw = process.env['ABAC_DENY_DOCUMENT_STATUSES'];
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function hasClaim(subject: AuthorizationSubject, claim: string): boolean {
  if (subject.claims.includes(claim)) return true;
  const wildcard = claim.replace(/:[^:]+$/, ':*');
  return subject.claims.includes(wildcard);
}

/**
 * Deny-by-default ABAC stub. Owner users may access their tenant; services need explicit claims.
 */
@Injectable()
export class AbacAuthorizationAdapter implements AuthorizationPort {
  private readonly deniedStatuses = parseDeniedStatuses();

  authorize(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    const { subject, action, resource } = request;

    if (!subject.tenantId) {
      return Promise.resolve('deny');
    }

    if (!resource) {
      if (action === 'document:list') {
        return Promise.resolve(this.allowCollectionList(subject) ? 'allow' : 'deny');
      }
      return Promise.resolve('deny');
    }

    const ownsResource =
      subject.kind === 'user'
        ? subject.id === resource.ownerId
        : subject.tenantId === resource.ownerId;
    if (!ownsResource) {
      return Promise.resolve('deny');
    }

    if (this.deniedStatuses.has(resource.status) && this.isReadFamily(action)) {
      return Promise.resolve('deny');
    }

    if (subject.kind === 'user') {
      return Promise.resolve('allow');
    }

    const required = ACTION_CLAIM[action];
    return Promise.resolve(hasClaim(subject, required) ? 'allow' : 'deny');
  }

  private allowCollectionList(subject: AuthorizationSubject): boolean {
    if (!subject.tenantId) {
      return false;
    }
    if (subject.kind === 'user') return true;
    return hasClaim(subject, 'document:list') || hasClaim(subject, 'document:read');
  }

  private isReadFamily(action: AuthorizationAction): boolean {
    return (
      action === 'document:read' ||
      action === 'document:list' ||
      action === 'document:content:read' ||
      action === 'document:chat'
    );
  }
}
