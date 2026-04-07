import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { type FieldState, type FieldTree, FormField } from '@angular/forms/signals';

import { FormFieldErrorsComponent } from '@web/app/shared/form/components/form-field-errors/form-field-errors.component';

const DEFAULT_TEXTAREA_ROWS = 4;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormFieldErrorsComponent],
  selector: 'app-textarea-field',
  styleUrl: './textarea-field.component.scss',
  templateUrl: './textarea-field.component.html',
})
export class TextareaFieldComponent {
  public readonly autocomplete = input('');
  public readonly errors = input<readonly string[]>([]);
  public readonly field = input.required<FieldTree<string>>();
  public readonly fieldErrors = computed<string[]>(() => this.getFieldErrorMessages());
  public readonly mergedErrors = computed(() => [...this.fieldErrors(), ...this.errors()]);
  public readonly showErrors = input.required<boolean>();
  public readonly hasErrors = computed(() => this.showErrors() && this.mergedErrors().length > 0);
  public readonly hint = input('');
  public readonly inputId = input.required<string>();

  public readonly label = input.required<string>();
  public readonly placeholder = input.required<string>();
  public readonly rows = input(DEFAULT_TEXTAREA_ROWS);

  private getFieldErrorMessages(): string[] {
    const fieldState = this.readFieldState();

    return fieldState
      .errors()
      .flatMap((error) => (typeof error.message === 'string' ? [error.message] : []));
  }

  private readFieldState(): FieldState<string> {
    return this.field()();
  }
}
