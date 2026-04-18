import { type ElementRef } from '@angular/core';

const DEFAULT_BOTTOM_STICK_THRESHOLD_PX = 96;
const DEFAULT_JUMP_TO_LATEST_MIN_THRESHOLD_PX = 180;
const DEFAULT_JUMP_TO_LATEST_ITEM_COUNT = 3;

interface ScrollAnchorControllerConfig {
  readonly bottomStickThresholdPx?: number;
  readonly jumpToLatestItemCount?: number;
  readonly jumpToLatestMinThresholdPx?: number;
}

interface TailItemChangeParams {
  readonly authorId: number;
  readonly container: HTMLElement;
  readonly currentUserId: number;
  readonly itemElements: readonly ElementRef<HTMLElement>[];
  readonly itemId: number;
}

export class ScrollAnchorController {
  private lastTrackedItemId: null | number = null;
  private shouldStickToBottom = true;

  public constructor(private readonly config: ScrollAnchorControllerConfig = {}) {}

  private get bottomStickThresholdPx(): number {
    return this.config.bottomStickThresholdPx ?? DEFAULT_BOTTOM_STICK_THRESHOLD_PX;
  }

  private getJumpToLatestThreshold(itemElements: readonly ElementRef<HTMLElement>[]): number {
    const tailElements = itemElements.slice(-this.jumpToLatestItemCount);

    if (tailElements.length === 0) {
      return this.jumpToLatestMinThresholdPx;
    }

    const tailHeight = tailElements.reduce(
      (totalHeight, elementRef) => totalHeight + elementRef.nativeElement.offsetHeight,
      0,
    );

    return Math.max(this.jumpToLatestMinThresholdPx, tailHeight);
  }

  private isFarFromBottom(
    container: HTMLElement,
    itemElements: readonly ElementRef<HTMLElement>[],
  ): boolean {
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight >
      this.getJumpToLatestThreshold(itemElements)
    );
  }

  private isNearBottom(container: HTMLElement): boolean {
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      this.bottomStickThresholdPx
    );
  }

  private get jumpToLatestItemCount(): number {
    return this.config.jumpToLatestItemCount ?? DEFAULT_JUMP_TO_LATEST_ITEM_COUNT;
  }

  private get jumpToLatestMinThresholdPx(): number {
    return this.config.jumpToLatestMinThresholdPx ?? DEFAULT_JUMP_TO_LATEST_MIN_THRESHOLD_PX;
  }

  public evaluateJumpVisibility(
    container: HTMLElement,
    itemElements: readonly ElementRef<HTMLElement>[],
  ): boolean {
    if (container.scrollHeight <= container.clientHeight) {
      return false;
    }

    return this.isFarFromBottom(container, itemElements);
  }

  public handleScroll(
    container: HTMLElement,
    itemElements: readonly ElementRef<HTMLElement>[],
  ): boolean {
    this.shouldStickToBottom = this.isNearBottom(container);

    return this.evaluateJumpVisibility(container, itemElements);
  }

  public handleTailItemChange(params: TailItemChangeParams): {
    readonly shouldScrollToBottom: boolean;
    readonly shouldShowJumpToLatest: boolean;
  } {
    const { authorId, container, currentUserId, itemElements, itemId } = params;

    if (this.lastTrackedItemId === null) {
      this.lastTrackedItemId = itemId;

      return {
        shouldScrollToBottom: false,
        shouldShowJumpToLatest: this.evaluateJumpVisibility(container, itemElements),
      };
    }

    if (this.lastTrackedItemId === itemId) {
      return {
        shouldScrollToBottom: false,
        shouldShowJumpToLatest: this.evaluateJumpVisibility(container, itemElements),
      };
    }

    const shouldScrollToBottom = authorId === currentUserId || this.shouldStickToBottom;
    this.lastTrackedItemId = itemId;

    if (shouldScrollToBottom) {
      this.shouldStickToBottom = true;

      return {
        shouldScrollToBottom: true,
        shouldShowJumpToLatest: false,
      };
    }

    return {
      shouldScrollToBottom: false,
      shouldShowJumpToLatest: this.evaluateJumpVisibility(container, itemElements),
    };
  }

  public jumpToLatest(container: HTMLElement): void {
    this.shouldStickToBottom = true;
    container.scrollTo({
      behavior: 'smooth',
      top: container.scrollHeight,
    });
  }
}
