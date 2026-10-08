import { Module } from '@nestjs/common';
import {
  CONNECTOR_INSTALLATION_REPOSITORY,
  CONNECTOR_REGISTRY,
} from './domain/connector.ports.js';
import { ConnectorRegistry } from './application/connector.registry.js';
import {
  CreateConnectorInstallationUseCase,
  DeleteConnectorInstallationUseCase,
  GetConnectorCatalogUseCase,
  GetConnectorPluginUseCase,
  ListConnectorInstallationsUseCase,
} from './application/connector.use-cases.js';
import {
  ExportToConnectorUseCase,
  ImportFromConnectorUseCase,
  ListConnectorImportablesUseCase,
} from './application/connector-sync.use-cases.js';
import { ConnectorRuntimeResolver } from './application/connector-runtime.resolver.js';
import {
  CompleteMailOAuthUseCase,
  StartMailOAuthUseCase,
} from './application/mail-oauth.use-cases.js';
import { ConnectorsController } from './presentation/connectors.controller.js';
import { ConnectorsOAuthController } from './presentation/connectors-oauth.controller.js';
import { ConnectorOAuthCallbackGuard } from './presentation/connector-oauth-callback.guard.js';
import { GmailMailConnector } from './infrastructure/adapters/mail/gmail-mail.connector.js';
import { OutlookMailConnector } from './infrastructure/adapters/mail/outlook-mail.connector.js';
import { PaperlessDmsConnector } from './infrastructure/adapters/paperless/paperless-dms.connector.js';
import { HomeAssistantHomeAutomationConnector } from './infrastructure/adapters/home-assistant/home-assistant-home-automation.connector.js';
import { AmazonS3StorageConnector } from './infrastructure/adapters/s3/amazon-s3-storage.connector.js';
import { PgConnectorInstallationRepository } from './infrastructure/pg-connector-installation.repository.js';
import { DocumentsModule } from '../documents/documents.module.js';

const MAIL_CATEGORY = {
  id: 'mail' as const,
  labelKey: 'connectors.categories.mail.label',
  descriptionKey: 'connectors.categories.mail.description',
};

const DMS_CATEGORY = {
  id: 'dms' as const,
  labelKey: 'connectors.categories.dms.label',
  descriptionKey: 'connectors.categories.dms.description',
};

const HOME_AUTOMATION_CATEGORY = {
  id: 'home_automation' as const,
  labelKey: 'connectors.categories.homeAutomation.label',
  descriptionKey: 'connectors.categories.homeAutomation.description',
};

const STORAGE_CATEGORY = {
  id: 'storage' as const,
  labelKey: 'connectors.categories.storage.label',
  descriptionKey: 'connectors.categories.storage.description',
};

@Module({
  imports: [DocumentsModule],
  controllers: [ConnectorsController, ConnectorsOAuthController],
  providers: [
    ConnectorRegistry,
    { provide: CONNECTOR_REGISTRY, useExisting: ConnectorRegistry },
    {
      provide: CONNECTOR_INSTALLATION_REPOSITORY,
      useClass: PgConnectorInstallationRepository,
    },
    GetConnectorCatalogUseCase,
    GetConnectorPluginUseCase,
    ListConnectorInstallationsUseCase,
    CreateConnectorInstallationUseCase,
    DeleteConnectorInstallationUseCase,
    ConnectorRuntimeResolver,
    ListConnectorImportablesUseCase,
    ImportFromConnectorUseCase,
    ExportToConnectorUseCase,
    StartMailOAuthUseCase,
    CompleteMailOAuthUseCase,
    ConnectorOAuthCallbackGuard,
    {
      provide: 'CONNECTOR_REGISTRY_BOOTSTRAP',
      useFactory: (registry: ConnectorRegistry) => {
        registry.registerCategory(MAIL_CATEGORY);
        registry.registerCategory(DMS_CATEGORY);
        registry.registerCategory(HOME_AUTOMATION_CATEGORY);
        registry.registerCategory(STORAGE_CATEGORY);
        registry.registerPlugin(new GmailMailConnector());
        registry.registerPlugin(new OutlookMailConnector());
        registry.registerPlugin(new PaperlessDmsConnector());
        registry.registerPlugin(new HomeAssistantHomeAutomationConnector());
        registry.registerPlugin(new AmazonS3StorageConnector());
        return true;
      },
      inject: [ConnectorRegistry],
    },
  ],
})
export class ConnectorsModule {}
