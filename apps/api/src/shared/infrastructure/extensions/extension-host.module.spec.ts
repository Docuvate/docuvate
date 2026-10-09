// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, afterEach } from 'vitest';
import { ExtensionHostModule } from './extension-host.module.js';

describe('ExtensionHostModule', () => {
  const priorModules = process.env['DOCUVATE_EXTENSION_MODULES'];
  const priorPath = process.env['DOCUVATE_EXTENSION_PATH'];

  afterEach(() => {
    if (priorModules === undefined) delete process.env['DOCUVATE_EXTENSION_MODULES'];
    else process.env['DOCUVATE_EXTENSION_MODULES'] = priorModules;
    if (priorPath === undefined) delete process.env['DOCUVATE_EXTENSION_PATH'];
    else process.env['DOCUVATE_EXTENSION_PATH'] = priorPath;
  });

  it('registers no imports when extension env is unset', () => {
    delete process.env['DOCUVATE_EXTENSION_MODULES'];
    delete process.env['DOCUVATE_EXTENSION_PATH'];
    const mod = ExtensionHostModule.register();
    expect(mod.imports).toEqual([]);
  });

  it('refuses to start when extension env is set in community build', () => {
    process.env['DOCUVATE_EXTENSION_MODULES'] = 'FakeEeModule';
    expect(() => ExtensionHostModule.register()).toThrow(/Community Edition/);
  });
});
