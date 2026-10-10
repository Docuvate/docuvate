// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  CreateSavedDocumentViewRequest,
  ReplaceDashboardLayoutRequest,
  UpdateSavedDocumentViewRequest,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { ForbiddenError, NotFoundError } from '../../../shared/domain/errors.js';
import type { IdGenerator } from '../../../shared/domain/ports.js';
import { ID_GENERATOR } from '../../../shared/domain/ports.js';
import {
  assertDashboardWidgetType,
  parseDashboardWidgetFields,
} from '../domain/dashboard-widget-config.js';
import {
  INSTALLATION_ROLE_READER,
  type InstallationRoleReader,
} from '../domain/installation-role.port.js';
import {
  assertCanMutateView,
  assertCanReadView,
  assertCanSetVisibility,
} from '../domain/saved-view-access.js';
import type { SavedDocumentViewEntity } from '../domain/workspace.types.js';
import { PgWorkspaceRepository } from '../infrastructure/pg-workspace.repository.js';
import { SavedViewScopeValidator } from '../infrastructure/saved-view-scope.validator.js';

@Injectable()
export class ListSavedViewsUseCase {
  constructor(private readonly workspace: PgWorkspaceRepository) {}

  execute(userId: string) {
    return this.workspace.listViewsVisibleToUser(userId);
  }
}

@Injectable()
export class GetSavedViewUseCase {
  constructor(private readonly workspace: PgWorkspaceRepository) {}

  async execute(userId: string, id: string): Promise<SavedDocumentViewEntity> {
    const view = await this.workspace.findViewById(id);
    if (!view) throw new NotFoundError('Saved view');
    assertCanReadView(userId, view);
    return view;
  }
}

@Injectable()
export class CreateSavedViewUseCase {
  constructor(
    private readonly workspace: PgWorkspaceRepository,
    private readonly scope: SavedViewScopeValidator,
    @Inject(INSTALLATION_ROLE_READER) private readonly installationRoles: InstallationRoleReader,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator
  ) {}

  async execute(userId: string, input: CreateSavedDocumentViewRequest) {
    const isAdmin = await this.installationRoles.isInstallationAdmin(userId);
    assertCanSetVisibility(isAdmin, input.visibility ?? 'private');
    await this.scope.assertWritableFilters(userId, input);
    const position = await this.workspace.nextViewPosition(userId);
    return this.workspace.createView(this.ids.generate(), userId, input, position);
  }
}

@Injectable()
export class UpdateSavedViewUseCase {
  constructor(
    private readonly workspace: PgWorkspaceRepository,
    private readonly scope: SavedViewScopeValidator,
    @Inject(INSTALLATION_ROLE_READER) private readonly installationRoles: InstallationRoleReader
  ) {}

  async execute(userId: string, id: string, input: UpdateSavedDocumentViewRequest) {
    const view = await this.workspace.findViewById(id);
    if (!view) throw new NotFoundError('Saved view');
    const isAdmin = await this.installationRoles.isInstallationAdmin(userId);
    assertCanMutateView(userId, isAdmin, view);
    const nextVisibility = input.visibility ?? view.visibility;
    if (input.visibility) {
      assertCanSetVisibility(isAdmin, input.visibility);
    }
    await this.scope.assertUpdateFilters(userId, nextVisibility, input);
    return this.workspace.updateView(id, input);
  }
}

@Injectable()
export class DeleteSavedViewUseCase {
  constructor(
    private readonly workspace: PgWorkspaceRepository,
    @Inject(INSTALLATION_ROLE_READER) private readonly installationRoles: InstallationRoleReader
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const view = await this.workspace.findViewById(id);
    if (!view) throw new NotFoundError('Saved view');
    const isAdmin = await this.installationRoles.isInstallationAdmin(userId);
    assertCanMutateView(userId, isAdmin, view);
    await this.workspace.deleteView(id);
  }
}

@Injectable()
export class ReorderSavedViewsUseCase {
  constructor(private readonly workspace: PgWorkspaceRepository) {}

  execute(userId: string, orderedIds: string[]) {
    return this.workspace.reorderViews(userId, orderedIds);
  }
}

async function assertWidgetsReferenceReadableViews(
  userId: string,
  options: { requireSharedTargets: boolean },
  widgets: ReplaceDashboardLayoutRequest['widgets'],
  loadView: (id: string) => Promise<SavedDocumentViewEntity | null>
): Promise<void> {
  for (const widget of widgets) {
    const type = assertDashboardWidgetType(widget.type);
    const fields = parseDashboardWidgetFields(type, {
      savedViewId: widget.savedViewId,
      itemLimit: widget.itemLimit,
    });
    if (!fields.savedViewId) continue;
    const view = await loadView(fields.savedViewId);
    if (!view) throw new NotFoundError('Saved view');
    assertCanReadView(userId, view);
    if (options.requireSharedTargets && view.visibility !== 'shared') {
      throw new ForbiddenError('Installation default can only reference shared saved views');
    }
  }
}

@Injectable()
export class GetDashboardLayoutUseCase {
  constructor(private readonly workspace: PgWorkspaceRepository) {}

  async execute(userId: string) {
    let widgets = await this.workspace.listWidgetsForUser(userId);
    if (widgets.length === 0) {
      const template = await this.workspace.getInstallationDefaultTemplate();
      if (template.length > 0) {
        await this.workspace.seedWidgetsFromTemplate(userId, template);
        widgets = await this.workspace.listWidgetsForUser(userId);
      }
    }
    return widgets;
  }
}

@Injectable()
export class ReplaceDashboardLayoutUseCase {
  constructor(
    private readonly workspace: PgWorkspaceRepository,
    @Inject(INSTALLATION_ROLE_READER) private readonly installationRoles: InstallationRoleReader
  ) {}

  async execute(userId: string, body: ReplaceDashboardLayoutRequest) {
    await assertWidgetsReferenceReadableViews(
      userId,
      { requireSharedTargets: false },
      body.widgets,
      (id) => this.workspace.findViewById(id)
    );
    return this.workspace.replaceWidgetsForUser(userId, body.widgets);
  }
}

@Injectable()
export class GetDashboardStatisticsUseCase {
  constructor(private readonly workspace: PgWorkspaceRepository) {}

  execute(userId: string) {
    return this.workspace.getDashboardStatistics(userId);
  }
}

@Injectable()
export class GetInstallationDashboardDefaultUseCase {
  constructor(private readonly workspace: PgWorkspaceRepository) {}

  async execute() {
    return this.workspace.getInstallationDefaultTemplate();
  }
}

@Injectable()
export class SetInstallationDashboardDefaultUseCase {
  constructor(
    private readonly workspace: PgWorkspaceRepository,
    @Inject(INSTALLATION_ROLE_READER) private readonly installationRoles: InstallationRoleReader
  ) {}

  async execute(userId: string, body: ReplaceDashboardLayoutRequest) {
    const isAdmin = await this.installationRoles.isInstallationAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenError('Only installation admins can change the default dashboard');
    }
    await assertWidgetsReferenceReadableViews(
      userId,
      { requireSharedTargets: true },
      body.widgets,
      (id) => this.workspace.findViewById(id)
    );
    await this.workspace.setInstallationDefaultTemplate(userId, body.widgets);
    return this.workspace.getInstallationDefaultTemplate();
  }
}

@Injectable()
export class GetInstallationAdminStatusUseCase {
  constructor(
    @Inject(INSTALLATION_ROLE_READER) private readonly installationRoles: InstallationRoleReader
  ) {}

  execute(userId: string) {
    return this.installationRoles.isInstallationAdmin(userId);
  }
}
