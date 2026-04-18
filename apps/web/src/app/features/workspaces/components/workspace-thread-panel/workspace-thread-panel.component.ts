import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { type Message } from '@flaptalk/api-contract';

import { WorkspaceChatMessageComponent } from '@web/app/features/workspaces/components/workspace-chat-message/workspace-chat-message.component';
import { WorkspaceMessageDateDividerComponent } from '@web/app/features/workspaces/components/workspace-message-date-divider/workspace-message-date-divider.component';
import { ListTransitionController } from '@web/app/features/workspaces/utils/list-transition-controller';
import { ScrollAnchorController } from '@web/app/features/workspaces/utils/scroll-anchor-controller';
import { ButtonComponent } from '@web/app/shared/ui/button/button';

const VISIBILITY_THRESHOLD = 0.72;
const ROOT_MESSAGE_PREVIEW_LENGTH = 180;
const ELLIPSIS_LENGTH = 3;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    DatePipe,
    WorkspaceChatMessageComponent,
    WorkspaceMessageDateDividerComponent,
  ],
  selector: 'app-workspace-thread-panel',
  styleUrl: './workspace-thread-panel.component.scss',
  templateUrl: './workspace-thread-panel.component.html',
})
export class WorkspaceThreadPanelComponent {
  private readonly listTransitionController = new ListTransitionController();
  private readonly messageItems = viewChildren<ElementRef<HTMLElement>>('threadMessageItem');
  private readonly scrollAnchorController = new ScrollAnchorController();
  private readonly threadContainer = viewChild<ElementRef<HTMLElement>>('threadContainer');
  private readonly visibleMessageIds = new Set<number>();
  private lastEmittedVisibleMessageId: null | number = null;

  public readonly currentReadMessageId = input<null | number>(null);
  public readonly currentUserId = input<null | number>(null);
  public readonly isPending = input.required<boolean>();
  public readonly replies = input.required<readonly Message[]>();
  public readonly rootMessage = input<Message | null>(null);
  public readonly rootMessagePreview = computed(() => {
    const rootMessage = this.rootMessage();

    if (rootMessage === null) {
      return '';
    }

    return rootMessage.body.length > ROOT_MESSAGE_PREVIEW_LENGTH
      ? `${rootMessage.body.slice(0, ROOT_MESSAGE_PREVIEW_LENGTH - ELLIPSIS_LENGTH)}...`
      : rootMessage.body;
  });
  public readonly showJumpToLatest = signal(false);
  public readonly visibleMessageChange = output<number>();

  // eslint-disable-next-line max-lines-per-function
  constructor() {
    this.initMessageTransitions();
    this.initJumpToLatestVisibility();
    this.initOwnReplyAutoScroll();

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

  private initJumpToLatestVisibility(): void {
    afterRenderEffect(() => {
      const container = this.threadContainer()?.nativeElement;

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

  private initOwnReplyAutoScroll(): void {
    afterRenderEffect(() => {
      const container = this.threadContainer()?.nativeElement;
      const replies = this.replies();
      const currentUserId = this.currentUserId();

      if (!container || this.isPending() || replies.length === 0 || currentUserId === null) {
        return;
      }

      const lastReply = replies.at(-1) ?? null;

      if (lastReply === null) {
        return;
      }

      const tailItemChange = this.scrollAnchorController.handleTailItemChange({
        authorId: lastReply.author.id,
        container,
        currentUserId,
        itemElements: this.messageItems(),
        itemId: lastReply.id,
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

  private isSameCalendarDay(leftDate: string, rightDate: string): boolean {
    const left = new Date(leftDate);
    const right = new Date(rightDate);

    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  private threadMessages(): readonly Message[] {
    const rootMessage = this.rootMessage();

    return rootMessage === null ? this.replies() : [rootMessage, ...this.replies()];
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

  public handleThreadScroll(): void {
    const container = this.threadContainer()?.nativeElement;

    if (!container) {
      return;
    }

    this.showJumpToLatest.set(
      this.scrollAnchorController.handleScroll(container, this.messageItems()),
    );
  }

  public isMessageUnread(messageId: number): boolean {
    const currentReadMessageId = this.currentReadMessageId() ?? 0;

    return messageId > currentReadMessageId;
  }

  public jumpToLatest(): void {
    const container = this.threadContainer()?.nativeElement;

    if (!container) {
      return;
    }

    this.showJumpToLatest.set(false);
    this.scrollAnchorController.jumpToLatest(container);
  }

  public shouldShowDateDivider(index: number): boolean {
    if (index === 0) {
      return true;
    }

    const messages = this.threadMessages();
    const previousMessage = messages[index - 1];
    const currentMessage = messages[index];

    if (!previousMessage || !currentMessage) {
      return false;
    }

    return !this.isSameCalendarDay(previousMessage.createdAt, currentMessage.createdAt);
  }

  public threadItems(): readonly Message[] {
    return this.threadMessages();
  }
}
