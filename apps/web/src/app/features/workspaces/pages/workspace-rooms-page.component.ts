import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { type BreadcrumbItem } from '@web/app/shared/ui/breadcrumbs/breadcrumbs.component';

import { CardComponent } from '@web/app/shared/ui/card/card';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';

import { KeyValueListComponent } from '@web/app/shared/ui/key-value-list/key-value-list.component';
import { type KeyValueListItem } from '@web/app/shared/ui/key-value-list/key-value-list.models';
import { PageHeaderComponent } from '@web/app/shared/ui/page-header/page-header.component';
import { PillComponent } from '@web/app/shared/ui/pill/pill.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent,
    EmptyStateComponent,
    KeyValueListComponent,
    PageHeaderComponent,
    PillComponent,
    RouterLink,
    ShellSectionCardComponent,
  ],
  selector: 'app-workspace-rooms-page',
  styleUrl: './workspace-rooms-page.component.scss',
  templateUrl: './workspace-rooms-page.component.html',
})
export class WorkspaceRoomsPageComponent {
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);

  public readonly breadcrumbs: readonly BreadcrumbItem[] = [
    {
      href: ['/', APP_ROUTE_PATHS.workspace],
      label: 'Workspace',
    },
    {
      href: null,
      label: 'Rooms',
    },
  ];
  public readonly canManageRooms = computed(() => this.workspaceFacadeService.canManageRooms());
  public readonly createRoomLink = [
    '/',
    APP_ROUTE_PATHS.workspace,
    APP_ROUTE_PATHS.workspaceSetup,
    APP_ROUTE_PATHS.workspaceSetupRooms,
    APP_ROUTE_PATHS.workspaceSetupRoomsNew,
  ];
  public readonly hasWorkspace = computed(() => this.workspaceFacadeService.hasWorkspace());
  public readonly isRoomCollectionPending = computed(() =>
    this.workspaceFacadeService.isRoomCollectionPending(),
  );
  public readonly memberLink = [
    '/',
    APP_ROUTE_PATHS.workspace,
    APP_ROUTE_PATHS.workspaceSetup,
    APP_ROUTE_PATHS.workspaceSetupMembers,
  ];
  public readonly rooms = computed(() => this.workspaceFacadeService.rooms());
  public readonly roomSearchPlaceholder = computed(() =>
    this.canManageRooms() ? 'Filter by room name or description' : 'Find a room by name or topic',
  );
  public readonly roomSearchTerm = signal('');
  public readonly visibleRooms = computed(() => {
    const normalizedSearchTerm = this.roomSearchTerm().trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return this.rooms();
    }

    return this.rooms().filter((room) =>
      [room.name, room.description ?? ''].join(' ').toLowerCase().includes(normalizedSearchTerm),
    );
  });
  public readonly roomStats = computed<readonly KeyValueListItem[]>(() => [
    {
      label: 'Configured rooms',
      value: String(this.workspaceFacadeService.roomCount()),
    },
    {
      label: 'Matching rooms',
      value: String(this.visibleRooms().length),
    },
    {
      label: 'Unread rooms',
      value: String(this.workspaceFacadeService.unreadRoomCount()),
    },
    {
      label: 'Unread messages',
      value: String(this.workspaceFacadeService.unreadMessageCount()),
    },
  ]);
  public readonly roomSurfaceTag = computed(() => (this.canManageRooms() ? 'Owner' : 'Rooms'));
  public readonly unreadMessageCountByRoomId = computed(() =>
    this.workspaceFacadeService.unreadMessageCountByRoomId(),
  );
  public readonly workspaceHomeLink = ['/', APP_ROUTE_PATHS.workspace];

  public getRoomLink(roomId: number): readonly string[] {
    return ['/', APP_ROUTE_PATHS.workspace, 'rooms', String(roomId)];
  }

  public getUnreadBadge(roomId: number): null | string {
    const unreadCount = this.unreadMessageCountByRoomId().get(roomId) ?? 0;

    return unreadCount > 0 ? String(unreadCount).padStart(2, '0') : null;
  }

  public updateRoomSearchTerm(value: string): void {
    this.roomSearchTerm.set(value);
  }
}
