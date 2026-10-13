// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  registerDecorator,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

import { validateDocumentChatCloudBaseUrlSync } from '../../infrastructure/chat/document-chat-cloud-url-security.js';

@ValidatorConstraint({ name: 'DocumentChatCloudBaseUrl', async: false })
export class DocumentChatCloudBaseUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value !== 'string') {
      return false;
    }
    return validateDocumentChatCloudBaseUrlSync(value) === null;
  }

  defaultMessage(): string {
    return 'documentChatCloudBaseUrl must be a valid HTTPS URL with a public hostname';
  }
}

export function IsDocumentChatCloudBaseUrl(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      target: object.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      constraints: [],
      validator: DocumentChatCloudBaseUrlConstraint,
    });
  };
}
