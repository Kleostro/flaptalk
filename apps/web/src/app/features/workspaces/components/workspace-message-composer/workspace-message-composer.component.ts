import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { type FieldTree, FormField } from '@angular/forms/signals';

import { ButtonComponent } from '@web/app/shared/ui/button/button';

const DEFAULT_COMPOSER_ROWS = 4;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, FormField],
  selector: 'app-workspace-message-composer',
  styleUrl: './workspace-message-composer.component.scss',
  templateUrl: './workspace-message-composer.component.html',
})
export class WorkspaceMessageComposerComponent {
  public readonly field = input.required<FieldTree<string>>();
  public readonly hint = input('');
  public readonly inputId = input.required<string>();
  public readonly pending = input(false);
  public readonly pendingLabel = input('Sending...');
  public readonly placeholder = input.required<string>();
  public readonly rows = input(DEFAULT_COMPOSER_ROWS);
  public readonly submitLabel = input.required<string>();
  public readonly submitted = output<Event>();
  public readonly surfaceTitle = input.required<string>();

  public handleSubmit(event: Event): void {
    this.submitted.emit(event);
  }

  public handleTextareaKeydown(event: KeyboardEvent): void {
    if (event.isComposing || this.pending()) {
      return;
    }

    const shouldSubmitWithModifier =
      event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.shiftKey;
    const shouldSubmitPlainEnter =
      event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey;

    if (!shouldSubmitWithModifier && !shouldSubmitPlainEnter) {
      return;
    }

    event.preventDefault();
    this.submitted.emit(event);
  }
}
