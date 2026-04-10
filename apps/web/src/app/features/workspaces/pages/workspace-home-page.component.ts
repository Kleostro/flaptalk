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
import {
  WORKSPACE_PAGE_ACTIVITY_CARDS,
  WORKSPACE_PAGE_OVERVIEW_CARDS,
  WORKSPACE_PAGE_ROOM_SETUP_HINTS,
} from '@web/app/features/workspaces/pages/workspace-page.constants';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { WorkspaceFormFactoryService } from '@web/app/features/workspaces/services/workspace-form.factory.service';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';
import { KeyValueListComponent } from '@web/app/shared/ui/key-value-list/key-value-list.component';
import { type KeyValueListItem } from '@web/app/shared/ui/key-value-list/key-value-list.models';
import { PageHeaderComponent } from '@web/app/shared/ui/page-header/page-header.component';
import { PillComponent } from '@web/app/shared/ui/pill/pill.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';
import { ShellPanelHeaderComponent } from '@web/app/shared/ui/shell-panel-header/shell-panel-header';
import { ShellStatCardComponent } from '@web/app/shared/ui/shell-stat-card/shell-stat-card';
import { TextInputFieldComponent } from '@web/app/shared/form/components/text-input-field/text-input-field.component';
import { TextareaFieldComponent } from '@web/app/shared/form/components/textarea-field/textarea-field.component';
import { WorkspaceMembersPanelComponent } from '@web/app/features/workspaces/components/workspace-members-panel/workspace-members-panel.component';
import { WorkspaceCatchUpPanelComponent } from '@web/app/features/workspaces/components/workspace-catch-up-panel/workspace-catch-up-panel.component';
import { WorkspaceOverviewPanelComponent } from '@web/app/features/workspaces/components/workspace-overview-panel/workspace-overview-panel.component';

const RECENT_ROOM_ACTIVITY_LIMIT = 3;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    KeyValueListComponent,
    PageHeaderComponent,
    PillComponent,
    RouterLink,
    ShellSectionCardComponent,
    ShellPanelHeaderComponent,
    ShellStatCardComponent,
    TextInputFieldComponent,
    TextareaFieldComponent,
    WorkspaceCatchUpPanelComponent,
    WorkspaceMembersPanelComponent,
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
  public readonly activityCards = WORKSPACE_PAGE_ACTIVITY_CARDS;
  public readonly canManageRooms = computed(() => this.workspaceFacadeService.canManageRooms());
  public readonly currentWorkspaceRole = computed(() =>
    this.workspaceFacadeService.currentWorkspaceRole(),
  );
  public readonly isOwner = computed(() => this.currentWorkspaceRole() === 'owner');
  public readonly controlPanelDescription = computed(() => {
    if (!this.hasWorkspace()) {
      return 'Create the first workspace shell, then start shaping rooms and membership flows.';
    }

    return this.isOwner()
      ? 'Structure, access, and room setup live here so owners can shape the workspace intentionally.'
      : 'This surface keeps members focused on rooms, recent activity, and shared workspace context.';
  });
  public readonly controlPanelTitle = computed(() =>
    this.isOwner() ? 'Owner control deck' : 'Member workspace view',
  );
  public readonly members = computed(() => this.workspaceFacadeService.members());
  public readonly currentMember = computed(
    () => this.members().find((member) => member.isCurrentUser) ?? null,
  );
  public readonly currentWorkspace = computed(() => this.workspaceFacadeService.currentWorkspace());
  public readonly hasWorkspace = computed(() => this.workspaceFacadeService.hasWorkspace());
  public readonly overviewCards = WORKSPACE_PAGE_OVERVIEW_CARDS;
  public readonly foundationDescription = computed(() =>
    this.hasWorkspace()
      ? this.overviewCards[1].description
      : this.overviewCards[1].pendingDescription,
  );
  public readonly hasRooms = computed(() => this.workspaceFacadeService.hasRooms());
  public readonly hasUnreadActivity = computed(
    () => this.workspaceFacadeService.unreadMessageCount() > 0,
  );
  public readonly workspaceModel = this.workspaceFormFactoryService.createWorkspaceModel();
  public readonly workspaceForm = this.workspaceFormFactoryService.createWorkspaceForm(
    this.workspaceModel,
  );
  public readonly isCreateWorkspaceInvalid = computed(() => this.workspaceForm().invalid());
  public readonly isCreateWorkspacePending = computed(() =>
    this.workspaceFacadeService.isCreateWorkspacePending(),
  );
  public readonly isMemberCollectionPending = computed(() =>
    this.workspaceFacadeService.isMemberCollectionPending(),
  );
  public readonly isWorkspaceActivityPending = computed(() =>
    this.workspaceFacadeService.isWorkspaceActivityPending(),
  );
  public readonly isWorkspaceFormSubmitted = signal(false);
  public readonly isWorkspacePending = computed(() =>
    this.workspaceFacadeService.isWorkspaceCollectionPending(),
  );
  public readonly memberHomeHint = computed(() => {
    if (!this.hasWorkspace()) {
      return 'Create the first workspace shell to unlock community navigation and onboarding.';
    }

    if (!this.hasRooms()) {
      return 'No rooms are visible yet. The workspace owner is still shaping the structure.';
    }

    if (!this.hasUnreadActivity()) {
      return 'You are caught up. New room activity and thread changes will appear here.';
    }

    return 'Unread updates are waiting in the sidebar and catch-up feed.';
  });
  public readonly messageCount = computed(() => this.workspaceFacadeService.messageCount());
  public readonly ownerCreateRoomLink = [
    '/',
    APP_ROUTE_PATHS.workspace,
    APP_ROUTE_PATHS.workspaceSetup,
    APP_ROUTE_PATHS.workspaceSetupRooms,
    APP_ROUTE_PATHS.workspaceSetupRoomsNew,
  ];
  public readonly ownerSetupLink = ['/', APP_ROUTE_PATHS.workspace, APP_ROUTE_PATHS.workspaceSetup];
  public readonly recentRoomActivity = computed(() =>
    [...this.workspaceFacadeService.workspaceActivity().rooms]
      .sort((leftRoomActivity, rightRoomActivity) => {
        const rightTimestamp = Date.parse(
          rightRoomActivity.lastMessage?.createdAt ?? new Date(0).toISOString(),
        );
        const leftTimestamp = Date.parse(
          leftRoomActivity.lastMessage?.createdAt ?? new Date(0).toISOString(),
        );

        return rightTimestamp - leftTimestamp;
      })
      .reverse()
      .slice(0, RECENT_ROOM_ACTIVITY_LIMIT),
  );
  public readonly roomCount = computed(() => this.workspaceFacadeService.roomCount());
  public readonly roomModel = this.workspaceFormFactoryService.createRoomModel();
  public readonly roomForm = this.workspaceFormFactoryService.createRoomForm(this.roomModel);
  public readonly roomSetupHints = WORKSPACE_PAGE_ROOM_SETUP_HINTS;
  public readonly roomsStatRows = computed<readonly KeyValueListItem[]>(() => [
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
  ]);
  public readonly showWorkspaceFormErrors = computed(
    () => this.isWorkspaceFormSubmitted() || this.workspaceForm().touched(),
  );
  public readonly workspaceCanvasDescription = computed(() => {
    if (!this.hasWorkspace()) {
      return 'Start from a compact product shell, then expand into rooms, messages, threads, and summaries.';
    }

    return this.isOwner()
      ? 'This is the control surface for workspace structure, access, room setup, and future catch-up flows.'
      : 'This is your community home for rooms, unread activity, and shared workspace context.';
  });
  public readonly workspaceCount = computed(() => this.workspaceFacadeService.workspaces().length);
  public readonly workspaceHeaderTitle = computed(() =>
    this.hasWorkspace()
      ? (this.currentWorkspace()?.name ?? 'Workspace')
      : 'Create the first workspace shell.',
  );
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
