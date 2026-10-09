import { useEffect, useState } from 'react';
import { getInstallationAdminStatus } from './api';

export function useInstallationRole(): 'admin' | 'member' | null {
  const [role, setRole] = useState<'admin' | 'member' | null>(null);

  useEffect(() => {
    void getInstallationAdminStatus()
      .then((s) => setRole(s.isInstallationAdmin ? 'admin' : 'member'))
      .catch(() => setRole('member'));
  }, []);

  return role;
}
