import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-field-errors',
  styleUrl: './form-field-errors.component.scss',
  templateUrl: './form-field-errors.component.html',
})
export class FormFieldErrorsComponent {
  public readonly errors = input.required<string[]>();
  public readonly isVisible = input.required<boolean>();
}
