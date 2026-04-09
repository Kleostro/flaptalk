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
import { Router, RouterLink } from '@angular/router';

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
import { ShellPanelHeaderComponent } from '@web/app/shared/ui/shell-panel-header/shell-panel-header';
import { ShellStatCardComponent } from '@web/app/shared/ui/shell-stat-card/shell-stat-card';
import { TextInputFieldComponent } from '@web/app/shared/form/components/text-input-field/text-input-field.component';
import { TextareaFieldComponent } from '@web/app/shared/form/components/textarea-field/textarea-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    RouterLink,
    ShellPanelHeaderComponent,
    ShellStatCardComponent,
    TextInputFieldComponent,
    TextareaFieldComponent,
  ],
  selector: 'app-workspace-home-page',
  styleUrl: './workspace-home-page.component.scss',
  templateUrl: './workspace-home-page.component.html',
})
export class WorkspaceHomePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);
  private readonly workspaceFormFactoryService = inject(WorkspaceFormFactoryService);

  public readonly activityCards = WORKSPACE_PAGE_ACTIVITY_CARDS;
  public readonly canManageRooms = computed(() => this.workspaceFacadeService.canManageRooms());
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
  public readonly hasRooms = computed(() => this.workspaceFacadeService.hasRooms());
  public readonly roomModel = this.workspaceFormFactoryService.createRoomModel();
  public readonly roomForm = this.workspaceFormFactoryService.createRoomForm(this.roomModel);
  public readonly isCreateRoomInvalid = computed(() => this.roomForm().invalid());
  public readonly isCreateRoomPending = computed(() =>
    this.workspaceFacadeService.isCreateRoomPending(),
  );
  public readonly workspaceModel = this.workspaceFormFactoryService.createWorkspaceModel();
  public readonly workspaceForm = this.workspaceFormFactoryService.createWorkspaceForm(
    this.workspaceModel,
  );
  public readonly isCreateWorkspaceInvalid = computed(() => this.workspaceForm().invalid());
  public readonly isCreateWorkspacePending = computed(() =>
    this.workspaceFacadeService.isCreateWorkspacePending(),
  );
  public readonly isRoomCollectionPending = computed(() =>
    this.workspaceFacadeService.isRoomCollectionPending(),
  );
  public readonly isRoomFormSubmitted = signal(false);
  public readonly isWorkspaceFormSubmitted = signal(false);
  public readonly isWorkspacePending = computed(() =>
    this.workspaceFacadeService.isWorkspaceCollectionPending(),
  );
  public readonly messageCount = computed(() => this.workspaceFacadeService.messageCount());
  public readonly roomCount = computed(() => this.workspaceFacadeService.roomCount());
  public readonly rooms = computed(() => this.workspaceFacadeService.rooms());
  public readonly roomSetupHints = WORKSPACE_PAGE_ROOM_SETUP_HINTS;
  public readonly roomsStatRows = computed(() => [
    {
      label: 'Configured rooms',
      value: String(this.roomCount()).padStart(2, '0'),
    },
    {
      label: 'Unread thread summaries',
      value: this.hasRooms() ? String(this.messageCount()).padStart(2, '0') : '00',
    },
    {
      label: 'Pending catch-up views',
      value: this.hasRooms() ? '01' : '00',
    },
  ]);
  public readonly showRoomFormErrors = computed(
    () => this.isRoomFormSubmitted() || this.roomForm().touched(),
  );
  public readonly showWorkspaceFormErrors = computed(
    () => this.isWorkspaceFormSubmitted() || this.workspaceForm().touched(),
  );
  public readonly workspaceCount = computed(() => this.workspaceFacadeService.workspaces().length);
  public readonly workspaceStateDescription = computed(() =>
    this.hasWorkspace()
      ? this.overviewCards[0].description
      : this.overviewCards[0].pendingDescription,
  );

  constructor() {
    this.workspaceFacadeService.clearSelectedRoom();
  }

  private canCreateRoom(): boolean {
    if (!this.isCreateRoomInvalid()) {
      return true;
    }

    this.toastService.error({
      message: 'Review the room details before continuing.',
      title: 'Room details are incomplete',
    });

    return false;
  }

  private handleCreateRoomError(error: unknown): void {
    this.toastService.error({
      message:
        error instanceof Error ? error.message : 'We could not create the room. Please try again.',
      title: 'Room creation failed',
    });
  }

  private handleCreateRoomSuccess(result: {
    readonly level: string;
    readonly message: string;
    readonly title: string;
  }): void {
    const createdRoomId = this.workspaceFacadeService.selectedRoom()?.id;

    this.roomModel.set({
      description: '',
      name: '',
    });
    this.isRoomFormSubmitted.set(false);
    this.toastService.success(result);

    if (createdRoomId) {
      void this.router.navigate(['/', APP_ROUTE_PATHS.workspace, 'rooms', createdRoomId]);
    }
  }

  public createRoom(event: Event): void {
    event.preventDefault();
    this.isRoomFormSubmitted.set(true);

    if (!this.canCreateRoom()) {
      return;
    }

    const workspaceId = this.currentWorkspace()?.id;

    if (!workspaceId) {
      this.toastService.error({
        message: 'Create a workspace first before adding rooms.',
        title: 'Workspace required',
      });
      return;
    }

    this.workspaceFacadeService
      .createRoom(workspaceId, this.roomModel())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.handleCreateRoomError(error);
        },
        next: (result) => {
          this.handleCreateRoomSuccess(result);
        },
      });
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

  public getRoomLink(roomId: number): string[] {
    return ['/', APP_ROUTE_PATHS.workspace, 'rooms', String(roomId)];
  }
}
