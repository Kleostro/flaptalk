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
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { WorkspaceFormFactoryService } from '@web/app/features/workspaces/services/workspace-form.factory.service';
import { type BreadcrumbItem } from '@web/app/shared/ui/breadcrumbs/breadcrumbs.component';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { EmptyStateComponent } from '@web/app/shared/ui/empty-state/empty-state.component';
import { EntityListItemComponent } from '@web/app/shared/ui/entity-list-item/entity-list-item.component';
import { PageHeaderComponent } from '@web/app/shared/ui/page-header/page-header.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';
import { ShellPanelHeaderComponent } from '@web/app/shared/ui/shell-panel-header/shell-panel-header';
import { TextInputFieldComponent } from '@web/app/shared/form/components/text-input-field/text-input-field.component';
import { TextareaFieldComponent } from '@web/app/shared/form/components/textarea-field/textarea-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    EntityListItemComponent,
    PageHeaderComponent,
    RouterLink,
    ShellSectionCardComponent,
    ShellPanelHeaderComponent,
    TextInputFieldComponent,
    TextareaFieldComponent,
  ],
  selector: 'app-workspace-room-create-page',
  styleUrl: './workspace-room-create-page.component.scss',
  templateUrl: './workspace-room-create-page.component.html',
})
export class WorkspaceRoomCreatePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);
  private readonly workspaceFormFactoryService = inject(WorkspaceFormFactoryService);

  public readonly breadcrumbs: readonly BreadcrumbItem[] = [
    {
      href: ['/', APP_ROUTE_PATHS.workspace],
      label: 'Workspace',
    },
    {
      href: ['/', APP_ROUTE_PATHS.workspace, APP_ROUTE_PATHS.workspaceSetup],
      label: 'Owner setup',
    },
    {
      href: null,
      label: 'Create room',
    },
  ];
  public readonly canManageRooms = computed(() => this.workspaceFacadeService.canManageRooms());
  public readonly currentWorkspace = computed(() => this.workspaceFacadeService.currentWorkspace());
  public readonly existingRooms = computed(() => this.workspaceFacadeService.rooms());
  public readonly roomModel = this.workspaceFormFactoryService.createRoomModel();
  public readonly roomForm = this.workspaceFormFactoryService.createRoomForm(this.roomModel);
  public readonly isCreateRoomInvalid = computed(() => this.roomForm().invalid());
  public readonly isCreateRoomPending = computed(() =>
    this.workspaceFacadeService.isCreateRoomPending(),
  );
  public readonly isRoomFormSubmitted = signal(false);
  public readonly setupLink = ['/', APP_ROUTE_PATHS.workspace, APP_ROUTE_PATHS.workspaceSetup];
  public readonly showRoomFormErrors = computed(
    () => this.isRoomFormSubmitted() || this.roomForm().touched(),
  );

  private handleCreateRoomError(error: unknown): void {
    this.toastService.error({
      message:
        error instanceof Error ? error.message : 'We could not create the room. Please try again.',
      title: 'Room creation failed',
    });
  }

  public createRoom(event: Event): void {
    event.preventDefault();
    this.isRoomFormSubmitted.set(true);

    if (this.isCreateRoomInvalid()) {
      this.toastService.error({
        message: 'Review the room details before continuing.',
        title: 'Room details are incomplete',
      });
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
        next: () => {
          const selectedRoomId = this.workspaceFacadeService.selectedRoom()?.id;

          this.toastService.success({
            message: 'The room is live and ready for its first discussion.',
            title: 'Room created',
          });

          if (selectedRoomId) {
            void this.router.navigate(['/', APP_ROUTE_PATHS.workspace, 'rooms', selectedRoomId]);
          }
        },
      });
  }
}
