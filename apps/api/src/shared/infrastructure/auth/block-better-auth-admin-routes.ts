/** Nest admin API owns IAM; better-auth /api/auth/admin/* must not be reachable over HTTP. */
export function isBetterAuthAdminPluginPath(pathname: string): boolean {
  return pathname === '/api/auth/admin' || pathname.startsWith('/api/auth/admin/');
}
