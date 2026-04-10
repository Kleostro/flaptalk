import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Room } from '@flaptalk/api-contract';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { ShellNavItemComponent } from '@web/app/shared/ui/shell-nav-item/shell-nav-item';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ShellNavItemComponent],
  selector: 'app-workspace-sidebar',
  styleUrl: './workspace-sidebar.component.scss',
  templateUrl: './workspace-sidebar.component.html',
})
export class WorkspaceSidebarComponent {
  protected readonly workspacePath = `/${APP_ROUTE_PATHS.workspace}`;
  public readonly activeRoomId = input<null | number>(null);
  public readonly hasWorkspace = input.required<boolean>();
  public readonly homeActive = input.required<boolean>();
  public readonly roomCount = input.required<number>();
  public readonly rooms = input.required<readonly Room[]>();
  public readonly totalUnreadCount = input(0);
  public readonly unreadMessageCountByRoomId = input<ReadonlyMap<number, number>>(new Map());
  public readonly userEmail = input<string | undefined>();

  public getNavIndexLabel(index: number): string {
    return String(index).padStart(2, '0');
  }

  public getRoomLink(roomId: number): string[] {
    return ['/', APP_ROUTE_PATHS.workspace, 'rooms', String(roomId)];
  }

  public getRoomUnreadBadge(roomId: number): null | string {
    const unreadCount = this.unreadMessageCountByRoomId().get(roomId) ?? 0;

    return unreadCount > 0 ? this.getNavIndexLabel(unreadCount) : null;
  }
}
