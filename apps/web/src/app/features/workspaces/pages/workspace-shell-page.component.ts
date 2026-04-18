import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { map, startWith } from 'rxjs';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { ToastService } from '@web/app/core/services/toast.service';
import { AuthFacadeService } from '@web/app/features/auth/services/auth-facade.service';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { WorkspaceSidebarComponent } from '@web/app/features/workspaces/components/workspace-sidebar/workspace-sidebar.component';
import { AppShellComponent } from '@web/app/shared/ui/app-shell/app-shell';
import {
  type BreadcrumbItem,
  BreadcrumbsComponent,
} from '@web/app/shared/ui/breadcrumbs/breadcrumbs.component';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { PillComponent } from '@web/app/shared/ui/pill/pill.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppShellComponent,
    BreadcrumbsComponent,
    ButtonComponent,
    PillComponent,
    RouterOutlet,
    WorkspaceSidebarComponent,
  ],
  selector: 'app-workspace-shell-page',
  styleUrl: './workspace-shell-page.component.scss',
  templateUrl: './workspace-shell-page.component.html',
})
export class WorkspaceShellPageComponent {
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  private readonly toastService = inject(ToastService);
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);

  public readonly currentWorkspace = computed(() => this.workspaceFacadeService.currentWorkspace());
  public readonly currentWorkspaceRole = computed(() =>
    this.workspaceFacadeService.currentWorkspaceRole(),
  );
  public readonly hasWorkspace = computed(() => this.workspaceFacadeService.hasWorkspace());
  public readonly isSetupRoute = computed(() =>
    this.currentUrl().startsWith(`/${APP_ROUTE_PATHS.workspace}/${APP_ROUTE_PATHS.workspaceSetup}`),
  );
  public readonly selectedRoom = computed(() => this.workspaceFacadeService.selectedRoom());
  public readonly isHomeRoute = computed(
    () => this.selectedRoom() === null && !this.isSetupRoute(),
  );
  public readonly isLogoutPending = computed(() => this.authFacadeService.isLogoutPending());
  public readonly isOwner = computed(() => this.currentWorkspaceRole() === 'owner');
  public readonly roomCount = computed(() => this.workspaceFacadeService.roomCount());
  public readonly rooms = computed(() => this.workspaceFacadeService.rooms());
  public readonly topbarBreadcrumbs = computed<readonly BreadcrumbItem[]>(() =>
    this.buildTopbarBreadcrumbs(this.currentUrl()),
  );
  public readonly totalUnreadMessageCount = computed(() =>
    this.workspaceFacadeService.unreadMessageCount(),
  );
  public readonly unreadMessageCountByRoomId = computed(() =>
    this.workspaceFacadeService.unreadMessageCountByRoomId(),
  );
  public readonly user = computed(() => this.authFacadeService.user());

  public readonly userInitials = computed(() => {
    const email = this.user()?.email;

    if (!email) {
      return 'FT';
    }

    const [localPart = ''] = email.split('@');
    const initials = localPart
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();

    return initials || 'FT';
  });

  private buildOwnerSetupBreadcrumbs(currentUrl: string): null | readonly BreadcrumbItem[] {
    const createRoomRoutePrefix =
      this.buildWorkspaceSetupRoutePrefix(APP_ROUTE_PATHS.workspaceSetupRooms) +
      `/${APP_ROUTE_PATHS.workspaceSetupRoomsNew}`;
    if (currentUrl.startsWith(createRoomRoutePrefix)) {
      return this.createRoomSetupBreadcrumbs();
    }

    if (
      currentUrl.startsWith(
        this.buildWorkspaceSetupRoutePrefix(APP_ROUTE_PATHS.workspaceSetupRooms),
      )
    ) {
      return this.createSimpleWorkspaceBreadcrumb('Rooms');
    }

    if (
      currentUrl.startsWith(
        this.buildWorkspaceSetupRoutePrefix(APP_ROUTE_PATHS.workspaceSetupMembers),
      )
    ) {
      return this.createSimpleWorkspaceBreadcrumb('Members');
    }

    return this.isSetupRoute() ? this.createSimpleWorkspaceBreadcrumb('Owner setup') : null;
  }

  private buildSelectedRoomBreadcrumbs(): null | readonly BreadcrumbItem[] {
    const selectedRoom = this.selectedRoom();

    if (!selectedRoom) {
      return null;
    }

    return [
      {
        href: ['/', APP_ROUTE_PATHS.workspace],
        label: 'Workspace',
      },
      {
        href: null,
        label: selectedRoom.name,
      },
    ];
  }

  private buildTopbarBreadcrumbs(currentUrl: string): readonly BreadcrumbItem[] {
    const ownerSetupBreadcrumbs = this.buildOwnerSetupBreadcrumbs(currentUrl);

    if (ownerSetupBreadcrumbs) {
      return ownerSetupBreadcrumbs;
    }

    const selectedRoomBreadcrumbs = this.buildSelectedRoomBreadcrumbs();

    if (selectedRoomBreadcrumbs) {
      return selectedRoomBreadcrumbs;
    }

    return [
      {
        href: null,
        label: this.currentWorkspace()?.name ?? 'Workspace home',
      },
    ];
  }

  private buildWorkspaceRootBreadcrumb(): BreadcrumbItem {
    return {
      href: ['/', APP_ROUTE_PATHS.workspace],
      label: 'Workspace',
    };
  }

  private buildWorkspaceSetupRoutePrefix(segment: string): string {
    return `/${APP_ROUTE_PATHS.workspace}/${APP_ROUTE_PATHS.workspaceSetup}/${segment}`;
  }

  private createRoomSetupBreadcrumbs(): readonly BreadcrumbItem[] {
    return [
      this.buildWorkspaceRootBreadcrumb(),
      {
        href: [
          '/',
          APP_ROUTE_PATHS.workspace,
          APP_ROUTE_PATHS.workspaceSetup,
          APP_ROUTE_PATHS.workspaceSetupRooms,
        ],
        label: 'Rooms',
      },
      {
        href: null,
        label: 'Create room',
      },
    ];
  }

  private createSimpleWorkspaceBreadcrumb(label: string): readonly BreadcrumbItem[] {
    return [
      this.buildWorkspaceRootBreadcrumb(),
      {
        href: null,
        label,
      },
    ];
  }

  public logout(): void {
    this.authFacadeService.logout().subscribe({
      error: () => {
        this.toastService.error({
          message: 'We could not end the current session. Please try again.',
          title: 'Logout failed',
        });
      },
      next: (result) => {
        this.toastService.success(result);
        void this.router.navigateByUrl(`/${APP_ROUTE_PATHS.login}`);
      },
    });
  }
}
