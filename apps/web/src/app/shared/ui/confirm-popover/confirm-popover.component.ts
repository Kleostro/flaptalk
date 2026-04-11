import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { ButtonComponent } from '@web/app/shared/ui/button/button';

const CONFIRM_POPOVER_CLOSE_DURATION_MS = 180;
const CONFIRM_POPOVER_GAP_PX = 10;
const CONFIRM_POPOVER_MIN_VIEWPORT_MARGIN_PX = 16;
const DEFAULT_CONFIRM_POPOVER_HEIGHT_PX = 176;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-confirm-popover-host',
  },
  imports: [ButtonComponent],
  selector: 'app-confirm-popover',
  styleUrl: './confirm-popover.component.scss',
  templateUrl: './confirm-popover.component.html',
})
export class ConfirmPopoverComponent {
  private readonly hostElement = viewChild.required<ElementRef<HTMLElement>>('hostElement');
  private readonly surfaceElement = viewChild<ElementRef<HTMLElement>>('surfaceElement');
  private closeTimeoutId: null | ReturnType<typeof setTimeout> = null;

  public readonly cancelLabel = input('Cancel');
  public readonly confirm = output();
  public readonly confirmLabel = input('Confirm');
  public readonly description = input('');
  public readonly disabled = input(false);
  public readonly isClosing = signal(false);
  public readonly isDestructive = input(true);
  public readonly isPositioned = signal(false);

  public readonly isRendered = signal(false);
  public readonly placement = signal<'above' | 'below'>('below');
  public readonly title = input.required<string>();
  public readonly triggerLabel = input.required<string>();

  private clearCloseTimeout(): void {
    if (this.closeTimeoutId === null) {
      return;
    }

    clearTimeout(this.closeTimeoutId);
    this.closeTimeoutId = null;
  }

  private measurePlacement(): void {
    const hostRect = this.hostElement().nativeElement.getBoundingClientRect();
    const measuredSurfaceHeight =
      this.surfaceElement()?.nativeElement.getBoundingClientRect().height ??
      DEFAULT_CONFIRM_POPOVER_HEIGHT_PX;
    const spaceBelow =
      window.innerHeight - hostRect.bottom - CONFIRM_POPOVER_MIN_VIEWPORT_MARGIN_PX;
    const spaceAbove = hostRect.top - CONFIRM_POPOVER_MIN_VIEWPORT_MARGIN_PX;
    const requiredHeight = measuredSurfaceHeight + CONFIRM_POPOVER_GAP_PX;

    this.placement.set(
      spaceBelow >= requiredHeight || spaceBelow >= spaceAbove ? 'below' : 'above',
    );
  }

  private open(): void {
    this.clearCloseTimeout();
    this.isClosing.set(false);
    this.isPositioned.set(false);
    this.isRendered.set(true);

    requestAnimationFrame(() => {
      this.measurePlacement();
      this.isPositioned.set(true);
    });
  }

  private requestClose(): void {
    if (!this.isRendered() || this.isClosing()) {
      return;
    }

    this.clearCloseTimeout();
    this.isClosing.set(true);

    this.closeTimeoutId = setTimeout(() => {
      this.isClosing.set(false);
      this.isPositioned.set(false);
      this.isRendered.set(false);
      this.closeTimeoutId = null;
    }, CONFIRM_POPOVER_CLOSE_DURATION_MS);
  }

  @HostListener('document:mousedown', ['$event'])
  public onDocumentMouseDown(event: MouseEvent): void {
    if (!this.isRendered()) {
      return;
    }

    if (!(event.target instanceof Node)) {
      return;
    }

    const host = this.hostElement().nativeElement;

    if (host.contains(event.target)) {
      return;
    }

    this.requestClose();
  }

  @HostListener('document:keydown.escape')
  public onEscapeKey(): void {
    if (!this.isRendered()) {
      return;
    }

    this.requestClose();
  }

  public onCancelClick(): void {
    this.requestClose();
  }

  public onConfirmClick(): void {
    this.confirm.emit();
    this.requestClose();
  }

  public toggle(): void {
    if (this.disabled()) {
      return;
    }

    if (this.isRendered()) {
      this.requestClose();
      return;
    }

    this.open();
  }
}
