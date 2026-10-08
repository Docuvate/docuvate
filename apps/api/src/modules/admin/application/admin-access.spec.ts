import { describe, expect, it } from 'vitest';
import { GetAdminAccessUseCase } from './admin.use-cases.js';

describe('GetAdminAccessUseCase', () => {
  const useCase = new GetAdminAccessUseCase();

  it('returns administrator for admin subject', () => {
    const result = useCase.execute({
      kind: 'user',
      id: 'a',
      tenantId: 'a',
      roles: ['admin', 'member'],
      claims: ['document:*', 'admin:*'],
    });
    expect(result.isAdministrator).toBe(true);
    expect(result.role).toBe('admin');
  });

  it('returns non-admin for member subject', () => {
    const result = useCase.execute({
      kind: 'user',
      id: 'b',
      tenantId: 'b',
      roles: ['member'],
      claims: ['document:*'],
    });
    expect(result.isAdministrator).toBe(false);
    expect(result.role).toBe('member');
  });
});
