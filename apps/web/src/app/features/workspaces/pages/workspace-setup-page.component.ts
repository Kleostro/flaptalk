import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';
import { KeyValueListComponent } from '@web/app/shared/ui/key-value-list/key-value-list.component';
import { type KeyValueListItem } from '@web/app/shared/ui/key-value-list/key-value-list.models';
import { PageHeaderComponent } from '@web/app/shared/ui/page-header/page-header.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent,
    EmptyStateComponent,
    KeyValueListComponent,
    PageHeaderComponent,
    RouterLink,
    ShellSectionCardComponent,
  ],
  selector: 'app-workspace-setup-page',
  styleUrl: './workspace-setup-page.component.scss',
  templateUrl: './workspace-setup-page.component.html',
})
export class WorkspaceSetupPageComponent {
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);
  protected readonly APP_ROUTE_PATHS = APP_ROUTE_PATHS;

  public readonly activeInviteCount = computed(() =>
    this.workspaceFacadeService.activeInviteCount(),
  );
  public readonly canManageInvites = computed(() => this.workspaceFacadeService.canManageInvites());
  public readonly canManageRooms = computed(() => this.workspaceFacadeService.canManageRooms());
  public readonly hasWorkspace = computed(() => this.workspaceFacadeService.hasWorkspace());
  public readonly invites = computed(() => this.workspaceFacadeService.invites());
  public readonly memberCount = computed(() => this.workspaceFacadeService.memberCount());
  public readonly membersLink = [
    '/',
    APP_ROUTE_PATHS.workspace,
    APP_ROUTE_PATHS.workspaceSetup,
    APP_ROUTE_PATHS.workspaceSetupMembers,
  ];
  public readonly roomCount = computed(() => this.workspaceFacadeService.roomCount());
  public readonly roomsLink = [
    '/',
    APP_ROUTE_PATHS.workspace,
    APP_ROUTE_PATHS.workspaceSetup,
    APP_ROUTE_PATHS.workspaceSetupRooms,
  ];
  public readonly setupHealthItems = computed<readonly KeyValueListItem[]>(() => [
    {
      label: 'Active invites',
      value: String(this.activeInviteCount()),
    },
    {
      label: 'Issued invites',
      value: String(this.invites().length),
    },
    {
      label: 'Configured rooms',
      value: String(this.roomCount()),
    },
    {
      label: 'Visible members',
      value: String(this.memberCount()),
    },
  ]);
}
