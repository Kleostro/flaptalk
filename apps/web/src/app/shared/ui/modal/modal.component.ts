import {
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

const MODAL_CLOSE_DURATION_MS = 220;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-modal',
  styleUrl: './modal.component.scss',
  templateUrl: './modal.component.html',
})
export class ModalComponent implements OnDestroy {
  private static openModalCount = 0;
  private closeTimer: null | ReturnType<typeof globalThis.setTimeout> = null;
  private isBodyLocked = false;

  public readonly closed = output();
  public readonly description = input<null | string>(null);
  public readonly isClosing = signal(false);
  public readonly isOpen = input(false);
  public readonly isRendered = signal(false);
  public readonly tag = input<null | string>(null);
  public readonly title = input.required<string>();

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.openModal();
        return;
      }

      this.startClosingSequence();
    });
  }

  private clearCloseTimer(): void {
    if (this.closeTimer === null) {
      return;
    }

    globalThis.clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  private lockBodyScroll(): void {
    if (this.isBodyLocked) {
      return;
    }

    ModalComponent.openModalCount += 1;
    this.isBodyLocked = true;
    globalThis.document.body.style.overflow = 'hidden';
  }

  private openModal(): void {
    this.clearCloseTimer();
    this.isRendered.set(true);
    this.isClosing.set(false);
    this.lockBodyScroll();
  }

  private startClosingSequence(emitAfterClose = false): void {
    if (!this.isRendered() || this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    this.clearCloseTimer();
    this.closeTimer = globalThis.setTimeout(() => {
      this.isClosing.set(false);
      this.isRendered.set(false);
      this.unlockBodyScroll();

      if (emitAfterClose) {
        this.closed.emit();
      }
    }, MODAL_CLOSE_DURATION_MS);
  }

  private unlockBodyScroll(): void {
    if (!this.isBodyLocked) {
      return;
    }

    ModalComponent.openModalCount = Math.max(0, ModalComponent.openModalCount - 1);
    this.isBodyLocked = false;

    if (ModalComponent.openModalCount === 0) {
      globalThis.document.body.style.overflow = '';
    }
  }

  @HostListener('document:keydown.escape')
  public handleEscape(): void {
    if (this.isRendered()) {
      this.requestClose();
    }
  }

  public ngOnDestroy(): void {
    this.clearCloseTimer();
    this.unlockBodyScroll();
  }

  public requestClose(): void {
    this.startClosingSequence(true);
  }
}
