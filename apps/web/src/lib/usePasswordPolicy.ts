// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto } from '@docuvate/contracts';
import { DEFAULT_PASSWORD_POLICY } from '@docuvate/contracts';
import { useEffect, useState } from 'react';

import { getPasswordPolicy } from './api';

export function usePasswordPolicy(): PasswordPolicyDto {
  const [policy, setPolicy] = useState<PasswordPolicyDto>(DEFAULT_PASSWORD_POLICY);

  useEffect(() => {
    void getPasswordPolicy()
      .then(setPolicy)
      .catch(() => {
        setPolicy(DEFAULT_PASSWORD_POLICY);
      });
  }, []);

  return policy;
}
