// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AuthSignInOptionsDto } from '@docuvate/contracts';
import { useEffect, useState } from 'react';

import { getAuthSignInOptions } from './api';

const DEFAULT_OPTIONS: AuthSignInOptionsDto = {
  passkeysEnabled: true,
  oidcProviders: [],
  emailChangeAvailable: false,
};

export function useAuthSignInOptions(): AuthSignInOptionsDto {
  const [options, setOptions] = useState<AuthSignInOptionsDto>(DEFAULT_OPTIONS);
  useEffect(() => {
    void getAuthSignInOptions()
      .then(setOptions)
      .catch(() => {
        setOptions(DEFAULT_OPTIONS);
      });
  }, []);
  return options;
}
