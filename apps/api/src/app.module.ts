// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import { AdminModule } from './modules/admin/admin.module.js';
import { AuthInvitationsModule } from './modules/auth/auth-invitations.module.js';
import { AuthPublicModule } from './modules/auth/auth-public.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { ConnectorsModule } from './modules/connectors/connectors.module.js';
import { DocumentPipelineModule } from './modules/document-pipeline/document-pipeline.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { DuplicatesModule } from './modules/duplicates/duplicates.module.js';
import { FoldersModule } from './modules/folders/folders.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { LabelsModule } from './modules/labels/labels.module.js';
import { MappenModule } from './modules/mappen/mappen.module.js';
import { ModelRegistryModule } from './modules/model-registry/model-registry.module.js';
import { OpenapiModule } from './modules/openapi/openapi.module.js';
import { RecognizedFieldsModule } from './modules/recognized-fields/recognized-fields.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { SftpIngressModule } from './modules/sftp-ingress/sftp-ingress.module.js';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module.js';
import { WorkspaceModule } from './modules/workspace/workspace.module.js';
import { OpenapiInfrastructureModule } from './openapi/openapi.module.js';
import { AuthModule } from './shared/infrastructure/auth/auth.module.js';
import { AuthorizationModule } from './shared/infrastructure/authorization/authorization.module.js';
import { DatabaseModule } from './shared/infrastructure/database/database.module.js';
import { ExtensionHostModule } from './shared/infrastructure/extensions/extension-host.module.js';
@Module({
  imports: [
    ExtensionHostModule.register(),
    OpenapiInfrastructureModule,
    DatabaseModule,
    AuthModule,
    AuthorizationModule,
    OpenapiModule,
    HealthModule,
    DocumentsModule,
    TaxonomyModule,
    LabelsModule,
    FoldersModule,
    MappenModule,
    DuplicatesModule,
    SettingsModule,
    RecognizedFieldsModule,
    DocumentPipelineModule,
    ConnectorsModule,
    ModelRegistryModule,
    AuthPublicModule,
    SearchModule,
    AdminModule,
    AuthInvitationsModule,
    WorkspaceModule,
    SftpIngressModule,
    ChatModule,
  ],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class AppModule {}
