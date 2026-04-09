import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { ToastService } from '@web/app/core/services/toast.service';
import { AuthFacadeService } from '@web/app/features/auth/services/auth-facade.service';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { WorkspaceFormFactoryService } from '@web/app/features/workspaces/services/workspace-form.factory.service';
import { AppShellComponent } from '@web/app/shared/ui/app-shell/app-shell';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { ShellNavItemComponent } from '@web/app/shared/ui/shell-nav-item/shell-nav-item';
import { ShellPanelHeaderComponent } from '@web/app/shared/ui/shell-panel-header/shell-panel-header';
import { ShellStatCardComponent } from '@web/app/shared/ui/shell-stat-card/shell-stat-card';
import { TextInputFieldComponent } from '@web/app/shared/form/components/text-input-field/text-input-field.component';
import { TextareaFieldComponent } from '@web/app/shared/form/components/textarea-field/textarea-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppShellComponent,
    ButtonComponent,
    CardComponent,
    DatePipe,
    ShellNavItemComponent,
    ShellPanelHeaderComponent,
    ShellStatCardComponent,
    TextInputFieldComponent,
    TextareaFieldComponent,
  ],
  selector: 'app-workspace-page',
  styleUrl: './workspace-page.component.scss',
  templateUrl: './workspace-page.component.html',
})
export class WorkspacePageComponent {
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);
  private readonly workspaceFormFactoryService = inject(WorkspaceFormFactoryService);

  public readonly activityCards = [
    {
      body: 'Unread activity, important summaries, and thread context will appear here as a calm catch-up surface.',
      title: 'Catch up',
    },
    {
      body: 'The next iteration will surface active discussions instead of forcing members into a raw room list.',
      title: 'Active threads',
    },
    {
      body: 'Rooms will appear as structured navigation blocks once the entity and shell wiring are ready.',
      title: 'Rooms',
    },
  ] as const;
  public readonly currentWorkspace = computed(() => this.workspaceFacadeService.currentWorkspace());

  public readonly currentWorkspaceRole = computed(() =>
    this.workspaceFacadeService.currentWorkspaceRole(),
  );
  public readonly hasWorkspace = computed(() => this.workspaceFacadeService.hasWorkspace());
  public readonly overviewCards = [
    {
      description:
        'The shell is connected to live workspace persistence and membership-aware access.',
      label: 'Workspace state',
      pendingDescription:
        'Create the first workspace to unlock rooms, member access, and future thread flow.',
      value: 'Active',
    },
    {
      description:
        'The UI is now moving toward a shell-first product layout instead of a cinematic entry page.',
      label: 'Current phase',
      pendingDescription:
        'This surface will turn into the operator home for rooms, summaries, and community context.',
      value: 'Foundation',
    },
  ] as const;
  public readonly foundationDescription = computed(() =>
    this.hasWorkspace()
      ? this.overviewCards[1].description
      : this.overviewCards[1].pendingDescription,
  );
  public readonly workspaceModel = this.workspaceFormFactoryService.createWorkspaceModel();
  public readonly workspaceForm = this.workspaceFormFactoryService.createWorkspaceForm(
    this.workspaceModel,
  );
  public readonly isCreateWorkspaceInvalid = computed(() => this.workspaceForm().invalid());
  public readonly isCreateWorkspacePending = computed(() =>
    this.workspaceFacadeService.isCreateWorkspacePending(),
  );
  public readonly isLogoutPending = computed(() => this.authFacadeService.isLogoutPending());
  public readonly isWorkspaceFormSubmitted = signal(false);
  public readonly isWorkspacePending = computed(() =>
    this.workspaceFacadeService.isWorkspaceCollectionPending(),
  );
  public readonly showWorkspaceFormErrors = computed(
    () => this.isWorkspaceFormSubmitted() || this.workspaceForm().touched(),
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
  public readonly workspaceCount = computed(() => this.workspaceFacadeService.workspaces().length);
  public readonly workspaceStateDescription = computed(() =>
    this.hasWorkspace()
      ? this.overviewCards[0].description
      : this.overviewCards[0].pendingDescription,
  );

  public createWorkspace(event: Event): void {
    event.preventDefault();
    this.isWorkspaceFormSubmitted.set(true);

    if (this.isCreateWorkspaceInvalid()) {
      this.toastService.error({
        message: 'Review the workspace details before continuing.',
        title: 'Workspace details are incomplete',
      });
      return;
    }

    this.workspaceFacadeService
      .createWorkspace(this.workspaceModel())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.toastService.error({
            message:
              error instanceof Error
                ? error.message
                : 'We could not create the workspace. Please try again.',
            title: 'Workspace creation failed',
          });
        },
        next: (result) => {
          this.toastService.success(result);
        },
      });
  }

  public logout(): void {
    this.authFacadeService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
