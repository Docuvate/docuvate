export function userInitials(user: { name?: string | null; email?: string | null } | undefined): string {
  if (!user) {
    return '?';
  }
  const name = user.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? '';
      const last = parts[parts.length - 1]?.[0] ?? '';
      const combined = `${first}${last}`.toUpperCase();
      return combined || '?';
    }
    return name.slice(0, 2).toUpperCase() || '?';
  }
  const email = user.email?.trim();
  if (email) {
    const local = email.split('@')[0] ?? '';
    if (local.length >= 2) {
      return local.slice(0, 2).toUpperCase();
    }
    return local.slice(0, 1).toUpperCase() || '?';
  }
  return '?';
}
