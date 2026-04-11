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
import { WORKSPACE_PAGE_OVERVIEW_CARDS } from '@web/app/features/workspaces/pages/workspace-page.constants';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { WorkspaceFormFactoryService } from '@web/app/features/workspaces/services/workspace-form.factory.service';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';
import { KeyValueListComponent } from '@web/app/shared/ui/key-value-list/key-value-list.component';
import { type KeyValueListItem } from '@web/app/shared/ui/key-value-list/key-value-list.models';
import { PageHeaderComponent } from '@web/app/shared/ui/page-header/page-header.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';
import { ShellPanelHeaderComponent } from '@web/app/shared/ui/shell-panel-header/shell-panel-header';
import { ShellStatCardComponent } from '@web/app/shared/ui/shell-stat-card/shell-stat-card';
import { TextInputFieldComponent } from '@web/app/shared/form/components/text-input-field/text-input-field.component';
import { TextareaFieldComponent } from '@web/app/shared/form/components/textarea-field/textarea-field.component';
import { WorkspaceOverviewPanelComponent } from '@web/app/features/workspaces/components/workspace-overview-panel/workspace-overview-panel.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    KeyValueListComponent,
    PageHeaderComponent,
    RouterLink,
    ShellSectionCardComponent,
    ShellPanelHeaderComponent,
    ShellStatCardComponent,
    TextInputFieldComponent,
    TextareaFieldComponent,
    WorkspaceOverviewPanelComponent,
  ],
  selector: 'app-workspace-home-page',
  styleUrl: './workspace-home-page.component.scss',
  templateUrl: './workspace-home-page.component.html',
})
export class WorkspaceHomePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);
  private readonly workspaceFormFactoryService = inject(WorkspaceFormFactoryService);

  public readonly activeInviteCount = computed(() =>
    this.workspaceFacadeService.activeInviteCount(),
  );
  public readonly canManageRooms = computed(() => this.workspaceFacadeService.canManageRooms());
  public readonly members = computed(() => this.workspaceFacadeService.members());
  public readonly currentMember = computed(
    () => this.members().find((member) => member.isCurrentUser) ?? null,
  );
  public readonly currentWorkspace = computed(() => this.workspaceFacadeService.currentWorkspace());
  public readonly currentWorkspaceRole = computed(() =>
    this.workspaceFacadeService.currentWorkspaceRole(),
  );
  public readonly hasWorkspace = computed(() => this.workspaceFacadeService.hasWorkspace());
  public readonly overviewCards = WORKSPACE_PAGE_OVERVIEW_CARDS;
  public readonly foundationDescription = computed(() =>
    this.hasWorkspace()
      ? this.overviewCards[1].description
      : this.overviewCards[1].pendingDescription,
  );
  public readonly isOwner = computed(() => this.currentWorkspaceRole() === 'owner');
  public readonly membersLink = [
    '/',
    APP_ROUTE_PATHS.workspace,
    APP_ROUTE_PATHS.workspaceSetup,
    APP_ROUTE_PATHS.workspaceSetupMembers,
  ];
  public readonly roomsLink = [
    '/',
    APP_ROUTE_PATHS.workspace,
    APP_ROUTE_PATHS.workspaceSetup,
    APP_ROUTE_PATHS.workspaceSetupRooms,
  ];
  public readonly homeNavigationCards = computed<
    readonly { readonly body: string; readonly link: readonly string[]; readonly title: string }[]
  >(() =>
    this.isOwner()
      ? [
          {
            body: 'Review existing rooms and open the dedicated room-creation flow.',
            link: this.roomsLink,
            title: 'Rooms',
          },
          {
            body: 'Manage members and invite links from one shared access surface.',
            link: this.membersLink,
            title: 'Members and access',
          },
        ]
      : [
          {
            body: 'Browse the current room structure and jump into active discussion surfaces.',
            link: this.roomsLink,
            title: 'Rooms',
          },
          {
            body: 'See who is inside the workspace and understand the shared community roster.',
            link: this.membersLink,
            title: 'People',
          },
        ],
  );
  public readonly workspaceModel = this.workspaceFormFactoryService.createWorkspaceModel();
  public readonly workspaceForm = this.workspaceFormFactoryService.createWorkspaceForm(
    this.workspaceModel,
  );
  public readonly isCreateWorkspaceInvalid = computed(() => this.workspaceForm().invalid());
  public readonly isCreateWorkspacePending = computed(() =>
    this.workspaceFacadeService.isCreateWorkspacePending(),
  );
  public readonly isWorkspaceFormSubmitted = signal(false);
  public readonly isWorkspacePending = computed(() =>
    this.workspaceFacadeService.isWorkspaceCollectionPending(),
  );
  public readonly memberCount = computed(() => this.workspaceFacadeService.memberCount());
  public readonly navigationTag = computed(() => {
    if (!this.hasWorkspace()) {
      return 'Next';
    }

    return this.isOwner() ? 'Owner' : 'Member';
  });
  public readonly roomCount = computed(() => this.workspaceFacadeService.roomCount());
  public readonly showWorkspaceFormErrors = computed(
    () => this.isWorkspaceFormSubmitted() || this.workspaceForm().touched(),
  );
  public readonly workspaceAnalyticsRows = computed<readonly KeyValueListItem[]>(() => [
    {
      label: 'Configured rooms',
      value: String(this.roomCount()).padStart(2, '0'),
    },
    {
      label: 'Unread rooms',
      value: String(this.workspaceFacadeService.unreadRoomCount()).padStart(2, '0'),
    },
    {
      label: 'Unread messages',
      value: String(this.workspaceFacadeService.unreadMessageCount()).padStart(2, '0'),
    },
    {
      label: 'Visible members',
      value: String(this.memberCount()).padStart(2, '0'),
    },
  ]);
  public readonly workspaceCanvasDescription = computed(() => {
    if (!this.hasWorkspace()) {
      return 'Start from a compact product shell, then expand into rooms, membership, and discussion flows.';
    }

    return this.isOwner()
      ? 'This dashboard stays focused on workspace analytics and navigation into owner tools.'
      : 'This dashboard keeps workspace analytics visible while navigation branches into rooms and people.';
  });
  public readonly workspaceCount = computed(() => this.workspaceFacadeService.workspaces().length);
  public readonly workspaceHeaderTitle = computed(() =>
    this.hasWorkspace()
      ? (this.currentWorkspace()?.name ?? 'Workspace')
      : 'Create the first workspace shell.',
  );
  public readonly workspaceStartRows = computed<readonly KeyValueListItem[]>(() => [
    {
      label: 'Current step',
      value: 'Create workspace',
    },
    {
      label: 'Next surface',
      value: 'Rooms',
    },
    {
      label: 'Then unlock',
      value: 'Members and access',
    },
  ]);
  public readonly workspaceStateDescription = computed(() =>
    this.hasWorkspace()
      ? this.overviewCards[0].description
      : this.overviewCards[0].pendingDescription,
  );

  constructor() {
    this.workspaceFacadeService.clearSelectedRoom();
  }

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
          this.workspaceModel.set({
            description: '',
            name: '',
          });
          this.isWorkspaceFormSubmitted.set(false);
          this.toastService.success(result);
        },
      });
  }
}
