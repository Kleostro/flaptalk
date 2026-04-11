import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { ToastService } from '@web/app/core/services/toast.service';
import { WorkspaceInvitesPanelComponent } from '@web/app/features/workspaces/components/workspace-invites-panel/workspace-invites-panel.component';
import { WorkspaceMembersPanelComponent } from '@web/app/features/workspaces/components/workspace-members-panel/workspace-members-panel.component';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { WorkspaceFormFactoryService } from '@web/app/features/workspaces/services/workspace-form.factory.service';
import { type BreadcrumbItem } from '@web/app/shared/ui/breadcrumbs/breadcrumbs.component';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';
import { KeyValueListComponent } from '@web/app/shared/ui/key-value-list/key-value-list.component';
import { type KeyValueListItem } from '@web/app/shared/ui/key-value-list/key-value-list.models';
import { ModalComponent } from '@web/app/shared/ui/modal/modal.component';
import { PageHeaderComponent } from '@web/app/shared/ui/page-header/page-header.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';
import { TextInputFieldComponent } from '@web/app/shared/form/components/text-input-field/text-input-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    KeyValueListComponent,
    ModalComponent,
    PageHeaderComponent,
    RouterLink,
    ShellSectionCardComponent,
    TextInputFieldComponent,
    WorkspaceInvitesPanelComponent,
    WorkspaceMembersPanelComponent,
  ],
  selector: 'app-workspace-members-page',
  styleUrl: './workspace-members-page.component.scss',
  templateUrl: './workspace-members-page.component.html',
})
export class WorkspaceMembersPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);
  private readonly workspaceFormFactoryService = inject(WorkspaceFormFactoryService);
  protected readonly APP_ROUTE_PATHS = APP_ROUTE_PATHS;

  public readonly activeInviteCount = computed(() =>
    this.workspaceFacadeService.activeInviteCount(),
  );
  public readonly breadcrumbs: readonly BreadcrumbItem[] = [
    {
      href: ['/', APP_ROUTE_PATHS.workspace],
      label: 'Workspace',
    },
    {
      href: null,
      label: 'Members',
    },
  ];
  public readonly canManageInvites = computed(() => this.workspaceFacadeService.canManageInvites());
  public readonly hasWorkspace = computed(() => this.workspaceFacadeService.hasWorkspace());
  public readonly homeLink = ['/', APP_ROUTE_PATHS.workspace];
  public readonly inviteModel = this.workspaceFormFactoryService.createInviteModel();
  public readonly inviteForm = this.workspaceFormFactoryService.createInviteForm(this.inviteModel);
  public readonly invites = computed(() => this.workspaceFacadeService.invites());
  public readonly isCreateInvitePending = computed(() =>
    this.workspaceFacadeService.isCreateInvitePending(),
  );
  public readonly isInviteCollectionPending = computed(() =>
    this.workspaceFacadeService.isInviteCollectionPending(),
  );
  public readonly isInviteFormOpen = signal(false);
  public readonly isInviteFormSubmitted = signal(false);
  public readonly isInviteInvalid = computed(() => {
    if (this.inviteForm().invalid()) {
      return true;
    }

    const normalizedEmail = this.inviteModel().email.trim();

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return true;
    }

    return (
      this.workspaceFormFactoryService.parseInviteExpiresInHours(
        this.inviteModel().expiresInHours,
      ) === null
    );
  });
  public readonly isMemberCollectionPending = computed(() =>
    this.workspaceFacadeService.isMemberCollectionPending(),
  );
  public readonly memberEmptyStateDescription = computed(() => {
    if (this.members().length === 0) {
      return 'No visible members yet. Accepted invites will start filling this roster.';
    }

    if (this.memberSearchTerm().trim().length > 0) {
      return 'No members match the current search. Try a broader email fragment or role.';
    }

    return 'No visible members yet. Accepted invites will start filling this roster.';
  });
  public readonly members = computed(() => this.workspaceFacadeService.members());
  public readonly memberSearchTerm = signal('');
  public readonly visibleMembers = computed(() => {
    const normalizedSearchTerm = this.memberSearchTerm().trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return this.members();
    }

    return this.members().filter((member) =>
      [member.user.email, member.role].join(' ').toLowerCase().includes(normalizedSearchTerm),
    );
  });
  public readonly memberPageStats = computed<readonly KeyValueListItem[]>(() => [
    {
      label: 'Members',
      value: String(this.workspaceFacadeService.memberCount()),
    },
    {
      label: 'Matching members',
      value: String(this.visibleMembers().length),
    },
    {
      label: 'Active invites',
      value: String(this.activeInviteCount()),
    },
    {
      label: 'Issued invites',
      value: String(this.invites().length),
    },
  ]);
  public readonly memberSearchPlaceholder = computed(() =>
    this.canManageInvites() ? 'Filter by email or role' : 'Find yourself or other visible members',
  );
  public readonly memberSurfaceDescription = computed(() =>
    this.canManageInvites()
      ? 'Review the member roster and manage invite access from the same surface.'
      : 'Review the current workspace roster and understand who is already inside the shared space.',
  );
  public readonly memberSurfaceTag = computed(() =>
    this.canManageInvites() ? 'Owner' : 'Community',
  );
  public readonly removingMemberId = computed(() => this.workspaceFacadeService.removingMemberId());
  public readonly revokingInviteId = computed(() => this.workspaceFacadeService.revokingInviteId());
  public readonly roomsLink = [
    '/',
    APP_ROUTE_PATHS.workspace,
    APP_ROUTE_PATHS.workspaceSetup,
    APP_ROUTE_PATHS.workspaceSetupRooms,
  ];
  public readonly showInviteFormErrors = computed(
    () => this.isInviteFormSubmitted() || this.inviteForm().touched(),
  );

  private getCurrentWorkspaceId(): null | number {
    return this.workspaceFacadeService.currentWorkspace()?.id ?? null;
  }

  private handleActionError(error: unknown, title: string, fallbackMessage: string): void {
    this.toastService.error({
      message: error instanceof Error ? error.message : fallbackMessage,
      title,
    });
  }

  private handleCreateInviteError(error: unknown): void {
    this.toastService.error({
      message:
        error instanceof Error
          ? error.message
          : 'We could not create the invite. Please try again.',
      title: 'Invite creation failed',
    });
  }

  private handleCreateInviteSuccess(result: {
    readonly invite: { readonly token: string };
    readonly result: { readonly level: string; readonly message: string; readonly title: string };
  }): void {
    this.inviteModel.set({
      email: '',
      expiresInHours: '72',
    });
    this.isInviteFormSubmitted.set(false);
    this.isInviteFormOpen.set(false);
    this.toastService.success(result.result);
    this.copyInviteLink(result.invite.token);
  }

  private resolveInviteLink(token: string): string {
    return new URL(`/${APP_ROUTE_PATHS.invites}/${token}`, globalThis.location.origin).toString();
  }

  public closeInviteModal(): void {
    this.isInviteFormOpen.set(false);
    this.isInviteFormSubmitted.set(false);
  }

  public copyInviteLink(token: string): void {
    void navigator.clipboard.writeText(this.resolveInviteLink(token)).then(
      () => {
        this.toastService.success({
          message: 'The invite link is ready to paste into chat or email.',
          title: 'Invite link copied',
        });
      },
      () => {
        this.toastService.error({
          message: 'We could not copy the invite link automatically.',
          title: 'Copy failed',
        });
      },
    );
  }

  public createInvite(event: Event): void {
    event.preventDefault();
    this.isInviteFormSubmitted.set(true);

    if (this.isInviteInvalid()) {
      this.toastService.error({
        message: 'Review the invite details before creating the link.',
        title: 'Invite details are incomplete',
      });
      return;
    }

    const workspaceId = this.workspaceFacadeService.currentWorkspace()?.id;
    const expiresInHours = this.workspaceFormFactoryService.parseInviteExpiresInHours(
      this.inviteModel().expiresInHours,
    );

    if (!workspaceId || expiresInHours === null) {
      this.toastService.error({
        message: 'We could not resolve the current workspace or invite expiration.',
        title: 'Invite unavailable',
      });
      return;
    }

    this.workspaceFacadeService
      .createInvite(workspaceId, {
        email: this.inviteModel().email,
        expiresInHours: String(expiresInHours),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.handleCreateInviteError(error);
        },
        next: (result) => {
          this.handleCreateInviteSuccess(result);
        },
      });
  }

  public removeMember(memberId: number): void {
    const workspaceId = this.getCurrentWorkspaceId();
    const member = this.members().find((workspaceMember) => workspaceMember.id === memberId);

    if (!workspaceId || !member) {
      this.toastService.error({
        message: 'We could not resolve the workspace member you want to remove.',
        title: 'Member unavailable',
      });
      return;
    }

    this.workspaceFacadeService
      .removeWorkspaceMember(workspaceId, memberId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.handleActionError(
            error,
            'Member removal failed',
            'We could not remove the member. Please try again.',
          );
        },
        next: (result) => {
          this.toastService.success(result);
        },
      });
  }

  public revokeInvite(inviteId: number): void {
    const workspaceId = this.getCurrentWorkspaceId();
    const invite = this.invites().find((workspaceInvite) => workspaceInvite.id === inviteId);

    if (!workspaceId || !invite) {
      this.toastService.error({
        message: 'We could not resolve the invite you want to revoke.',
        title: 'Invite unavailable',
      });
      return;
    }

    this.workspaceFacadeService
      .revokeInvite(workspaceId, inviteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.handleActionError(
            error,
            'Invite revoke failed',
            'We could not revoke the invite. Please try again.',
          );
        },
        next: (result) => {
          this.toastService.success(result);
        },
      });
  }

  public updateMemberSearchTerm(value: string): void {
    this.memberSearchTerm.set(value);
  }
}
