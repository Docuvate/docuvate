// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DynamicModule, Module } from '@nestjs/common';

/**
 * Optional Nest modules loaded from DOCUVATE_EXTENSION_MODULES (comma-separated class names)
 * or DOCUVATE_EXTENSION_PATH (directory with compiled extension entry). Community Edition
 * ships with both unset; commercial modules live in a separate repository and image layer.
 */
@Module({})
// Nest dynamic module host; static register() only.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class ExtensionHostModule {
  static register(): DynamicModule {
    const moduleNames = process.env.DOCUVATE_EXTENSION_MODULES?.trim();
    const modulePath = process.env.DOCUVATE_EXTENSION_PATH?.trim();
    if (moduleNames || modulePath) {
      throw new Error(
        'DOCUVATE_EXTENSION_MODULES or DOCUVATE_EXTENSION_PATH is set but this Community Edition build includes no extension loader bundle. Use a commercial edition image or unset these variables.'
      );
    }
    return {
      module: ExtensionHostModule,
      imports: [],
    };
  }
}
