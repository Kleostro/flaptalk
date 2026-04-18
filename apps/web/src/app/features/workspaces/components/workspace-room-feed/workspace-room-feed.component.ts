import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { type Message, type Room } from '@flaptalk/api-contract';

import { WorkspaceChatMessageComponent } from '@web/app/features/workspaces/components/workspace-chat-message/workspace-chat-message.component';
import { WorkspaceMessageDateDividerComponent } from '@web/app/features/workspaces/components/workspace-message-date-divider/workspace-message-date-divider.component';
import { ListTransitionController } from '@web/app/features/workspaces/utils/list-transition-controller';
import { ScrollAnchorController } from '@web/app/features/workspaces/utils/scroll-anchor-controller';
import { ButtonComponent } from '@web/app/shared/ui/button/button';

const VISIBILITY_THRESHOLD = 0.72;

export type WorkspaceRoomFeedResumeMode = 'default' | 'first-unread' | 'latest';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, WorkspaceChatMessageComponent, WorkspaceMessageDateDividerComponent],
  selector: 'app-workspace-room-feed',
  styleUrl: './workspace-room-feed.component.scss',
  templateUrl: './workspace-room-feed.component.html',
})
export class WorkspaceRoomFeedComponent {
  private readonly feedContainer = viewChild<ElementRef<HTMLElement>>('feedContainer');
  private readonly listTransitionController = new ListTransitionController();
  private readonly messageItems = viewChildren<ElementRef<HTMLElement>>('messageItem');
  private readonly scrollAnchorController = new ScrollAnchorController();
  private readonly visibleMessageIds = new Set<number>();
  private lastAppliedResumeKey: null | string = null;
  private lastEmittedVisibleMessageId: null | number = null;

  public readonly activeThreadMessageId = input<null | number>(null);
  public readonly currentReadMessageId = input<null | number>(null);
  public readonly currentUserId = input<null | number>(null);
  public readonly isPending = input.required<boolean>();
  public readonly messages = input.required<readonly Message[]>();
  public readonly resumeMode = input<WorkspaceRoomFeedResumeMode>('default');
  public readonly resumeTargetMessageId = input<null | number>(null);
  public readonly room = input<null | Room>(null);
  public readonly selectThread = output<number>();
  public readonly showJumpToLatest = signal(false);
  public readonly visibleMessageChange = output<number>();

  constructor() {
    this.initMessageTransitions();
    this.initJumpToLatestVisibility();
    this.initOwnMessageAutoScroll();
    this.initMessageVisibilityObserver();
    this.initResumeScroll();
  }

  private emitVisibleMessageProgress(): void {
    if (this.visibleMessageIds.size === 0) {
      return;
    }

    const nextVisibleMessageId = Math.max(...this.visibleMessageIds);
    const currentReadMessageId = this.currentReadMessageId() ?? 0;
    const lastEmittedVisibleMessageId = this.lastEmittedVisibleMessageId ?? 0;
    const progressFloor = Math.max(currentReadMessageId, lastEmittedVisibleMessageId);

    if (nextVisibleMessageId <= progressFloor) {
      return;
    }

    this.lastEmittedVisibleMessageId = nextVisibleMessageId;
    this.visibleMessageChange.emit(nextVisibleMessageId);
  }

  private getResumeTargetMessageId(
    messages: readonly Message[],
    resumeMode: WorkspaceRoomFeedResumeMode,
  ): null | number {
    const explicitResumeTargetMessageId = this.resumeTargetMessageId();

    if (
      explicitResumeTargetMessageId !== null &&
      messages.some((message) => message.id === explicitResumeTargetMessageId)
    ) {
      return explicitResumeTargetMessageId;
    }

    if (messages.length === 0) {
      return null;
    }

    if (resumeMode === 'latest') {
      return messages.at(-1)?.id ?? null;
    }

    const currentReadMessageId = this.currentReadMessageId() ?? 0;

    return (
      messages.find((message) => message.id > currentReadMessageId)?.id ??
      messages.at(-1)?.id ??
      null
    );
  }

  private initJumpToLatestVisibility(): void {
    afterRenderEffect(() => {
      const container = this.feedContainer()?.nativeElement;

      if (!container) {
        return;
      }

      this.showJumpToLatest.set(
        this.scrollAnchorController.evaluateJumpVisibility(container, this.messageItems()),
      );
    });
  }

  private initMessageTransitions(): void {
    afterRenderEffect(() => {
      this.listTransitionController.apply(this.messageItems(), (element) => {
        const messageId = Number(element.dataset['messageId'] ?? Number.NaN);

        return Number.isFinite(messageId) ? messageId : null;
      });
    });
  }

  private initMessageVisibilityObserver(): void {
    effect((onCleanup) => {
      const elements = this.messageItems();

      if (typeof IntersectionObserver === 'undefined' || elements.length === 0) {
        return;
      }

      this.visibleMessageIds.clear();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!(entry.target instanceof HTMLElement)) {
              continue;
            }

            const messageId = Number(entry.target.dataset['messageId'] ?? Number.NaN);

            if (!Number.isFinite(messageId)) {
              continue;
            }

            if (entry.isIntersecting && entry.intersectionRatio >= VISIBILITY_THRESHOLD) {
              this.visibleMessageIds.add(messageId);
            } else {
              this.visibleMessageIds.delete(messageId);
            }
          }

          this.emitVisibleMessageProgress();
        },
        {
          threshold: [VISIBILITY_THRESHOLD],
        },
      );

      for (const element of elements) {
        observer.observe(element.nativeElement);
      }

      onCleanup(() => {
        observer.disconnect();
        this.visibleMessageIds.clear();
      });
    });
  }

  private initOwnMessageAutoScroll(): void {
    afterRenderEffect(() => {
      const container = this.feedContainer()?.nativeElement;
      const messages = this.messages();
      const currentUserId = this.currentUserId();

      if (!container || this.isPending() || messages.length === 0 || currentUserId === null) {
        return;
      }

      const lastMessage = messages.at(-1) ?? null;

      if (lastMessage === null) {
        return;
      }

      const tailItemChange = this.scrollAnchorController.handleTailItemChange({
        authorId: lastMessage.author.id,
        container,
        currentUserId,
        itemElements: this.messageItems(),
        itemId: lastMessage.id,
      });

      this.showJumpToLatest.set(tailItemChange.shouldShowJumpToLatest);

      if (!tailItemChange.shouldScrollToBottom) {
        return;
      }

      queueMicrotask(() => {
        this.scrollAnchorController.jumpToLatest(container);
      });
    });
  }

  private initResumeScroll(): void {
    effect(() => {
      const roomId = this.room()?.id ?? null;
      const elements = this.messageItems();
      const messages = this.messages();
      const resumeMode = this.resumeMode();

      if (
        roomId === null ||
        this.isPending() ||
        resumeMode === 'default' ||
        messages.length === 0 ||
        elements.length === 0
      ) {
        return;
      }

      const resumeTargetMessageId = this.getResumeTargetMessageId(messages, resumeMode);

      if (resumeTargetMessageId === null) {
        return;
      }

      const resumeKey =
        `${roomId}:${resumeMode}:${resumeTargetMessageId}:` +
        `${this.currentReadMessageId() ?? 'none'}:${messages.length}`;

      if (this.lastAppliedResumeKey === resumeKey) {
        return;
      }

      const targetElement = elements.find(
        (element) => Number(element.nativeElement.dataset['messageId']) === resumeTargetMessageId,
      )?.nativeElement;

      if (!targetElement) {
        return;
      }

      this.lastAppliedResumeKey = resumeKey;

      queueMicrotask(() => {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    });
  }

  private isSameCalendarDay(leftDate: string, rightDate: string): boolean {
    const left = new Date(leftDate);
    const right = new Date(rightDate);

    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  public getDateDividerLabel(rawDate: string): string {
    const targetDate = new Date(rawDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (this.isSameCalendarDay(targetDate.toISOString(), today.toISOString())) {
      return 'Today';
    }

    if (this.isSameCalendarDay(targetDate.toISOString(), yesterday.toISOString())) {
      return 'Yesterday';
    }

    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: targetDate.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    }).format(targetDate);
  }

  public handleFeedScroll(): void {
    const container = this.feedContainer()?.nativeElement;

    if (!container) {
      return;
    }

    this.showJumpToLatest.set(
      this.scrollAnchorController.handleScroll(container, this.messageItems()),
    );
  }

  public isFirstUnreadMessage(messageId: number): boolean {
    const currentReadMessageId = this.currentReadMessageId() ?? 0;

    return this.messages().find((message) => message.id > currentReadMessageId)?.id === messageId;
  }

  public isMessageUnread(messageId: number): boolean {
    const currentReadMessageId = this.currentReadMessageId() ?? 0;

    return messageId > currentReadMessageId;
  }

  public jumpToLatest(): void {
    const container = this.feedContainer()?.nativeElement;

    if (!container) {
      return;
    }

    this.showJumpToLatest.set(false);
    this.scrollAnchorController.jumpToLatest(container);
  }

  public openThread(messageId: number): void {
    this.selectThread.emit(messageId);
  }

  public shouldShowDateDivider(index: number): boolean {
    if (index === 0) {
      return true;
    }

    const messages = this.messages();
    const previousMessage = messages[index - 1];
    const currentMessage = messages[index];

    if (!previousMessage || !currentMessage) {
      return false;
    }

    return !this.isSameCalendarDay(previousMessage.createdAt, currentMessage.createdAt);
  }
}
