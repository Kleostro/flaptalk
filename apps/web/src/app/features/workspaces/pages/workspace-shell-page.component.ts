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
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { PillComponent } from '@web/app/shared/ui/pill/pill.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppShellComponent,
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
  public readonly topbarTitle = computed(() => {
    if (this.isSetupRoute()) {
      return 'Owner setup';
    }

    return this.selectedRoom()?.name ?? this.currentWorkspace()?.name ?? 'Workspace Home';
  });
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
