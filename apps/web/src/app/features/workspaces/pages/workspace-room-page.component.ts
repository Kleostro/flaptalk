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
import { type WorkspaceRoomFeedResumeMode } from '@web/app/features/workspaces/components/workspace-room-feed/workspace-room-feed.component';
import { WorkspaceThreadPanelComponent } from '@web/app/features/workspaces/components/workspace-thread-panel/workspace-thread-panel.component';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { WorkspaceFormFactoryService } from '@web/app/features/workspaces/services/workspace-form.factory.service';
import { createWorkspaceRoomViewModel } from '@web/app/features/workspaces/view-models/workspace-room.view-model';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { KeyValueListComponent } from '@web/app/shared/ui/key-value-list/key-value-list.component';
import { PageHeaderComponent } from '@web/app/shared/ui/page-header/page-header.component';
import { ShellSectionCardComponent } from '@web/app/shared/ui/shell-section-card/shell-section-card.component';
import { ShellPanelHeaderComponent } from '@web/app/shared/ui/shell-panel-header/shell-panel-header';
import { TextareaFieldComponent } from '@web/app/shared/form/components/textarea-field/textarea-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardComponent,
    KeyValueListComponent,
    PageHeaderComponent,
    ShellSectionCardComponent,
    ShellPanelHeaderComponent,
    TextareaFieldComponent,
    WorkspaceRoomFeedComponent,
    WorkspaceThreadPanelComponent,
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
  public readonly hasSelectedThread = computed(() =>
    this.workspaceFacadeService.hasSelectedThread(),
  );
  public readonly isCreateMessagePending = computed(() =>
    this.workspaceFacadeService.isCreateMessagePending(),
  );
  public readonly isMessageCollectionPending = computed(() =>
    this.workspaceFacadeService.isMessageCollectionPending(),
  );
  public readonly isMessageFormSubmitted = signal(false);
  public readonly isReplyFormSubmitted = signal(false);
  public readonly isThreadPending = computed(() => this.workspaceFacadeService.isThreadPending());
  public readonly lastReadMessageId = computed(
    () => this.workspaceFacadeService.getSelectedRoomReadState()?.lastReadMessageId ?? null,
  );
  public readonly messageCount = computed(() => this.workspaceFacadeService.messageCount());
  public readonly messageModel = this.workspaceFormFactoryService.createMessageModel();
  public readonly messageForm = this.workspaceFormFactoryService.createMessageForm(
    this.messageModel,
  );
  public readonly messages = computed(() => this.workspaceFacadeService.messages());
  public readonly replyModel = this.workspaceFormFactoryService.createMessageModel();
  public readonly replyForm = this.workspaceFormFactoryService.createMessageForm(this.replyModel);
  public readonly roomResumeMode = signal<WorkspaceRoomFeedResumeMode>('default');
  public readonly selectedRoom = computed(() => this.workspaceFacadeService.selectedRoom());
  public readonly selectedThreadReplies = computed(() =>
    this.workspaceFacadeService.selectedThreadReplies(),
  );
  public readonly selectedThreadRootMessage = computed(() =>
    this.workspaceFacadeService.selectedThreadRootMessage(),
  );
  public readonly roomViewModel = computed(() =>
    createWorkspaceRoomViewModel({
      currentWorkspaceName: this.currentWorkspace()?.name ?? null,
      currentWorkspaceRole: this.currentWorkspaceRole(),
      hasSelectedThread: this.hasSelectedThread(),
      messageCount: this.messageCount(),
      resumeMode: this.roomResumeMode(),
      room: this.selectedRoom(),
      selectedThreadReplyCount: this.selectedThreadReplies().length,
      selectedThreadRootMessage: this.selectedThreadRootMessage(),
      unreadMessageCount: this.workspaceFacadeService.getSelectedRoomUnreadCount(),
    }),
  );
  public readonly showMessageFormErrors = computed(
    () => this.isMessageFormSubmitted() || this.messageForm().touched(),
  );
  public readonly showReplyFormErrors = computed(
    () => this.isReplyFormSubmitted() || this.replyForm().touched(),
  );

  constructor() {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const roomId = this.parseRouteEntityId(params.get('roomId'));

      if (roomId !== null) {
        this.workspaceFacadeService.selectRoom(roomId);
      }
    });

    this.activatedRoute.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const resumeParam = params.get('resume');
      const threadParam = this.parseRouteEntityId(params.get('thread'));

      if (resumeParam === 'unread') {
        this.roomResumeMode.set('first-unread');
      } else if (resumeParam === 'latest') {
        this.roomResumeMode.set('latest');
      } else {
        this.roomResumeMode.set('default');
      }

      if (threadParam !== null) {
        this.workspaceFacadeService.selectThread(threadParam);
        return;
      }

      this.workspaceFacadeService.clearSelectedThread();
    });
  }

  private getCurrentRoomId(): null | number {
    return this.selectedRoom()?.id ?? null;
  }

  private getReplyContext(): null | { readonly roomId: number; readonly rootMessageId: number } {
    const rootMessageId = this.selectedThreadRootMessage()?.id ?? null;

    if (!rootMessageId) {
      this.toastService.error({
        message: 'Open a thread first before replying.',
        title: 'Thread required',
      });
      return null;
    }

    const roomId = this.getCurrentRoomId();

    if (!roomId) {
      this.toastService.error({
        message: 'We could not resolve the current room.',
        title: 'Room unavailable',
      });
      return null;
    }

    return { roomId, rootMessageId };
  }

  private handleMessageError(error: unknown, title: string, fallbackMessage: string): void {
    this.toastService.error({
      message: error instanceof Error ? error.message : fallbackMessage,
      title,
    });
  }

  private parseRouteEntityId(rawValue: null | string): null | number {
    if (!rawValue || !/^\d+$/.test(rawValue)) {
      return null;
    }

    const parsedValue = Number(rawValue);

    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }

  private resetReplyForm(rootMessageId: number): void {
    this.replyModel.set({
      body: '',
      parentMessageId: rootMessageId,
    });
    this.isReplyFormSubmitted.set(false);
  }

  private sendReply(roomId: number, rootMessageId: number): void {
    this.workspaceFacadeService
      .createMessage(roomId, {
        ...this.replyModel(),
        parentMessageId: rootMessageId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.handleMessageError(
            error,
            'Reply failed',
            'We could not send the reply. Please try again.',
          );
        },
        next: (result) => {
          this.resetReplyForm(rootMessageId);
          this.toastService.success({
            ...result,
            message: 'Your reply is now attached to the thread.',
            title: 'Reply sent',
          });
        },
      });
  }

  private sendRoomMessage(message: {
    readonly body: string;
    readonly parentMessageId: null | number;
  }): void {
    const roomId = this.getCurrentRoomId();

    if (!roomId) {
      this.toastService.error({
        message: 'We could not resolve the current room.',
        title: 'Room unavailable',
      });
      return;
    }

    this.workspaceFacadeService
      .createMessage(roomId, message)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.handleMessageError(
            error,
            'Message failed',
            'We could not send the message. Please try again.',
          );
        },
        next: (result) => {
          this.messageModel.set({
            body: '',
            parentMessageId: null,
          });
          this.isMessageFormSubmitted.set(false);
          this.toastService.success(result);
        },
      });
  }

  private updateVisibleReadProgress(messageId: number): void {
    const roomId = this.getCurrentRoomId();

    if (!roomId) {
      return;
    }

    this.workspaceFacadeService
      .markRoomRead(roomId, messageId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => undefined,
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

    this.sendRoomMessage(this.messageModel());
  }

  public createReply(event: Event): void {
    event.preventDefault();
    this.isReplyFormSubmitted.set(true);

    if (this.replyForm().invalid()) {
      this.toastService.error({
        message: 'Write a reply before sending it into the thread.',
        title: 'Reply is empty',
      });
      return;
    }

    const replyContext = this.getReplyContext();

    if (!replyContext) {
      return;
    }

    this.sendReply(replyContext.roomId, replyContext.rootMessageId);
  }

  public handleVisibleMessageChange(messageId: number): void {
    this.updateVisibleReadProgress(messageId);
  }

  public openThread(messageId: number): void {
    this.isReplyFormSubmitted.set(false);
    this.replyModel.set({
      body: '',
      parentMessageId: messageId,
    });
    this.workspaceFacadeService.selectThread(messageId);
  }
}
