import type { ConnectorRuntimePorts } from './connector-runtime.ports.js';
import type {
  ConnectorAuthDescriptor,
  ConnectorCategoryDescriptor,
  ConnectorCategoryId,
  ConnectorConfigurationInput,
  ConnectorInstallationEntity,
  ConnectorPluginDescriptor,
  ConnectorPluginId,
  ConnectorValidationResult,
} from './connector.types.js';

/** Shared operations for a category (mail fetch, DMS push, …) — implemented by adapters later. */
export interface MailConnectorCategoryPort {
  readonly categoryId: 'mail';
}

export interface DmsConnectorCategoryPort {
  readonly categoryId: 'dms';
}

export interface HomeAutomationConnectorCategoryPort {
  readonly categoryId: 'home_automation';
}

export interface StorageConnectorCategoryPort {
  readonly categoryId: 'storage';
}

export type ConnectorCategoryPort =
  | MailConnectorCategoryPort
  | DmsConnectorCategoryPort
  | HomeAutomationConnectorCategoryPort
  | StorageConnectorCategoryPort;

export interface ConnectorPlugin {
  readonly descriptor: ConnectorPluginDescriptor;
  authDescriptor(): ConnectorAuthDescriptor;
  validateConfiguration(input: ConnectorConfigurationInput): Promise<ConnectorValidationResult>;
  openRuntime(credentials: ConnectorConfigurationInput): ConnectorRuntimePorts;
}

export interface ConnectorRegistryPort {
  listCategories(): ConnectorCategoryDescriptor[];
  listPlugins(categoryId?: ConnectorCategoryId): ConnectorPlugin[];
  getPlugin(pluginId: ConnectorPluginId): ConnectorPlugin | undefined;
}

export interface CreateConnectorInstallationInput {
  userId: string;
  pluginId: ConnectorPluginId;
  displayName: string;
  credentials: ConnectorConfigurationInput;
}

export interface ConnectorInstallationRecord extends ConnectorInstallationEntity {
  credentials: ConnectorConfigurationInput;
}

export interface ConnectorInstallationRepository {
  listForUser(userId: string): Promise<ConnectorInstallationEntity[]>;
  findByIdForUser(userId: string, installationId: string): Promise<ConnectorInstallationRecord | null>;
  create(input: CreateConnectorInstallationInput): Promise<ConnectorInstallationEntity>;
  deleteForUser(userId: string, installationId: string): Promise<boolean>;
  deleteForUserByPlugin(userId: string, pluginId: ConnectorPluginId): Promise<void>;
}

export const CONNECTOR_REGISTRY = Symbol('CONNECTOR_REGISTRY');
export const CONNECTOR_INSTALLATION_REPOSITORY = Symbol('CONNECTOR_INSTALLATION_REPOSITORY');
