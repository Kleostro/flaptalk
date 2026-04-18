import { type ElementRef } from '@angular/core';

const DEFAULT_LIST_TRANSITION_DURATION_MS = 240;

interface ListTransitionControllerConfig {
  readonly durationMs?: number;
}

export class ListTransitionController {
  private readonly previousItemIds = new Set<number>();
  private readonly previousItemOffsets = new Map<number, number>();

  public constructor(private readonly config: ListTransitionControllerConfig = {}) {}

  private animateInsertedItem(element: HTMLElement): void {
    if (typeof element.animate !== 'function') {
      return;
    }

    element.animate(
      [
        {
          opacity: 0,
          transform: 'translateY(0.85rem) scale(0.985)',
        },
        {
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        },
      ],
      {
        duration: this.durationMs,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both',
      },
    );
  }

  private animateMovedItem(element: HTMLElement, deltaY: number): void {
    if (typeof element.animate !== 'function' || Math.abs(deltaY) < 1) {
      return;
    }

    element.animate(
      [
        {
          transform: `translateY(${deltaY}px)`,
        },
        {
          transform: 'translateY(0)',
        },
      ],
      {
        duration: this.durationMs,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    );
  }

  private get durationMs(): number {
    return this.config.durationMs ?? DEFAULT_LIST_TRANSITION_DURATION_MS;
  }

  public apply(
    itemElements: readonly ElementRef<HTMLElement>[],
    getItemId: (element: HTMLElement) => null | number,
  ): void {
    const currentOffsets = new Map<number, number>();
    const currentIds = new Set<number>();

    for (const elementRef of itemElements) {
      const element = elementRef.nativeElement;
      const itemId = getItemId(element);

      if (itemId === null) {
        continue;
      }

      currentIds.add(itemId);
      currentOffsets.set(itemId, element.offsetTop);

      if (this.previousItemIds.size === 0) {
        continue;
      }

      const previousOffset = this.previousItemOffsets.get(itemId);

      if (previousOffset === undefined) {
        this.animateInsertedItem(element);
        continue;
      }

      this.animateMovedItem(element, previousOffset - element.offsetTop);
    }

    this.previousItemIds.clear();

    for (const itemId of currentIds) {
      this.previousItemIds.add(itemId);
    }

    this.previousItemOffsets.clear();

    for (const [itemId, offsetTop] of currentOffsets) {
      this.previousItemOffsets.set(itemId, offsetTop);
    }
  }
}
