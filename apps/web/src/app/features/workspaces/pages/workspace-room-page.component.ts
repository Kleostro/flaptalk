import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { ToastService } from '@web/app/core/services/toast.service';
import { WorkspaceRoomFeedComponent } from '@web/app/features/workspaces/components/workspace-room-feed/workspace-room-feed.component';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { WorkspaceFormFactoryService } from '@web/app/features/workspaces/services/workspace-form.factory.service';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { ShellPanelHeaderComponent } from '@web/app/shared/ui/shell-panel-header/shell-panel-header';
import { TextareaFieldComponent } from '@web/app/shared/form/components/textarea-field/textarea-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardComponent,
    ShellPanelHeaderComponent,
    TextareaFieldComponent,
    WorkspaceRoomFeedComponent,
  ],
  selector: 'app-workspace-room-page',
  styleUrl: './workspace-room-page.component.scss',
  templateUrl: './workspace-room-page.component.html',
})
export class WorkspaceRoomPageComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);
  private readonly workspaceFormFactoryService = inject(WorkspaceFormFactoryService);

  public readonly currentWorkspace = computed(() => this.workspaceFacadeService.currentWorkspace());
  public readonly currentWorkspaceRole = computed(() =>
    this.workspaceFacadeService.currentWorkspaceRole(),
  );
  public readonly hasMessages = computed(() => this.workspaceFacadeService.hasMessages());
  public readonly isCreateMessagePending = computed(() =>
    this.workspaceFacadeService.isCreateMessagePending(),
  );
  public readonly isMessageCollectionPending = computed(() =>
    this.workspaceFacadeService.isMessageCollectionPending(),
  );
  public readonly isMessageFormSubmitted = signal(false);
  public readonly messageCount = computed(() => this.workspaceFacadeService.messageCount());
  public readonly messageModel = this.workspaceFormFactoryService.createMessageModel();
  public readonly messageForm = this.workspaceFormFactoryService.createMessageForm(
    this.messageModel,
  );
  public readonly messages = computed(() => this.workspaceFacadeService.messages());
  public readonly roomHealthRows = computed(() => [
    {
      label: 'Messages',
      value: String(this.messageCount()).padStart(2, '0'),
    },
    {
      label: 'Owner access',
      value: this.currentWorkspaceRole() === 'owner' ? 'Yes' : 'No',
    },
    {
      label: 'Thread layer',
      value: 'Next',
    },
  ]);
  public readonly selectedRoom = computed(() => this.workspaceFacadeService.selectedRoom());
  public readonly showMessageFormErrors = computed(
    () => this.isMessageFormSubmitted() || this.messageForm().touched(),
  );

  constructor() {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const roomId = Number(params.get('roomId'));

      if (Number.isFinite(roomId)) {
        this.workspaceFacadeService.selectRoom(roomId);
      }
    });
  }

  public createMessage(event: Event): void {
    event.preventDefault();
    this.isMessageFormSubmitted.set(true);

    if (this.messageForm().invalid()) {
      this.toastService.error({
        message: 'Write a message before sending it to the room.',
        title: 'Message is empty',
      });
      return;
    }

    const roomId = this.selectedRoom()?.id;

    if (!roomId) {
      this.toastService.error({
        message: 'We could not resolve the current room.',
        title: 'Room unavailable',
      });
      return;
    }

    this.workspaceFacadeService
      .createMessage(roomId, this.messageModel())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.toastService.error({
            message:
              error instanceof Error
                ? error.message
                : 'We could not send the message. Please try again.',
            title: 'Message failed',
          });
        },
        next: (result) => {
          this.messageModel.set({
            body: '',
          });
          this.isMessageFormSubmitted.set(false);
          this.toastService.success(result);
        },
      });
  }
}
