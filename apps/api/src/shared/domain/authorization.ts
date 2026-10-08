import type { DocumentStatus } from '../../modules/documents/domain/document.entity.js';

export type AuthorizationAction =
  | 'document:read'
  | 'document:list'
  | 'document:write'
  | 'document:delete'
  | 'document:content:read'
  | 'document:chat';

export type AuthorizationDecision = 'allow' | 'deny';

export type AuthorizationSubjectKind = 'user' | 'service';

/** Principal attributes evaluated by ABAC (tenant, roles, claims). */
export interface AuthorizationSubject {
  kind: AuthorizationSubjectKind;
  id: string;
  /** Installation tenant id; required - missing scope must deny. */
  tenantId: string;
  roles: readonly string[];
  claims: readonly string[];
}

/** Document resource attributes attached to policy rules. */
export interface DocumentResourceAttributes {
  ownerId: string;
  status: DocumentStatus;
  tagIds: readonly string[];
  folderId: string | null;
  mappeId: string | null;
}

export interface AuthorizationRequest {
  subject: AuthorizationSubject;
  action: AuthorizationAction;
  resource?: DocumentResourceAttributes;
}

export interface AuthorizationPort {
  authorize(request: AuthorizationRequest): Promise<AuthorizationDecision>;
}

export const AUTHORIZATION_PORT = Symbol('AUTHORIZATION_PORT');
