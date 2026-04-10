import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { type Message, type Room } from '@flaptalk/api-contract';

const VISIBILITY_THRESHOLD = 0.72;

export type WorkspaceRoomFeedResumeMode = 'default' | 'first-unread' | 'latest';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  selector: 'app-workspace-room-feed',
  styleUrl: './workspace-room-feed.component.scss',
  templateUrl: './workspace-room-feed.component.html',
})
export class WorkspaceRoomFeedComponent {
  private readonly messageItems = viewChildren<ElementRef<HTMLElement>>('messageItem');
  private readonly visibleMessageIds = new Set<number>();
  private lastAppliedResumeKey: null | string = null;
  private lastEmittedVisibleMessageId: null | number = null;

  public readonly activeThreadMessageId = input<null | number>(null);
  public readonly currentReadMessageId = input<null | number>(null);
  public readonly isPending = input.required<boolean>();
  public readonly messages = input.required<readonly Message[]>();
  public readonly resumeMode = input<WorkspaceRoomFeedResumeMode>('default');
  public readonly room = input<null | Room>(null);
  public readonly selectThread = output<number>();
  public readonly visibleMessageChange = output<number>();

  constructor() {
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

  public getMessageAuthorInitials(email: string): string {
    const [localPart = ''] = email.split('@');
    const initials = localPart
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();

    return initials || 'FT';
  }

  public isFirstUnreadMessage(messageId: number): boolean {
    const currentReadMessageId = this.currentReadMessageId() ?? 0;

    return this.messages().find((message) => message.id > currentReadMessageId)?.id === messageId;
  }

  public isMessageUnread(messageId: number): boolean {
    const currentReadMessageId = this.currentReadMessageId() ?? 0;

    return messageId > currentReadMessageId;
  }

  public openThread(messageId: number): void {
    this.selectThread.emit(messageId);
  }
}
