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
  private lastEmittedVisibleMessageId: null | number = null;

  public readonly activeThreadMessageId = input<null | number>(null);
  public readonly currentReadMessageId = input<null | number>(null);
  public readonly isPending = input.required<boolean>();
  public readonly messages = input.required<readonly Message[]>();
  public readonly room = input<null | Room>(null);
  public readonly selectThread = output<number>();
  public readonly visibleMessageChange = output<number>();

  constructor() {
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

  public getMessageAuthorInitials(email: string): string {
    const [localPart = ''] = email.split('@');
    const initials = localPart
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();

    return initials || 'FT';
  }

  public openThread(messageId: number): void {
    this.selectThread.emit(messageId);
  }
}
