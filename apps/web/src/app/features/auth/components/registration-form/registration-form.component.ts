import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { type FieldTree } from '@angular/forms/signals';

import {
  AUTH_FIELD_AUTOCOMPLETE,
  AUTH_FIELD_IDS,
  AUTH_FIELD_LABELS,
  AUTH_FIELD_PLACEHOLDERS,
  AUTH_PASSWORD_REQUIREMENTS,
  AUTH_REGISTRATION_FORM_CONTENT,
  type AuthFieldAutocomplete,
  type AuthFieldLabels,
  type AuthFieldPlaceholders,
} from '@web/app/features/auth/constants/auth.constants';
import { TextInputFieldComponent } from '@web/app/shared/form/components/text-input-field/text-input-field.component';
import { ButtonComponent } from '@web/app/shared/ui/button/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, TextInputFieldComponent],
  selector: 'app-registration-form',
  styleUrl: './registration-form.component.scss',
  templateUrl: './registration-form.component.html',
})
export class RegistrationFormComponent {
  public readonly autocomplete: AuthFieldAutocomplete = AUTH_FIELD_AUTOCOMPLETE;
  public readonly confirmPasswordErrors = input<readonly string[]>([]);
  public readonly emailField = input.required<FieldTree<string>>();
  public readonly fieldIds = AUTH_FIELD_IDS;
  public readonly formContent = AUTH_REGISTRATION_FORM_CONTENT;
  public readonly isPending = input.required<boolean>();
  public readonly labels: AuthFieldLabels = AUTH_FIELD_LABELS;
  public readonly passwordField = input.required<FieldTree<string>>();
  public readonly passwordRequirements = AUTH_PASSWORD_REQUIREMENTS;
  public readonly pendingSubmitLabel = input.required<string>();
  public readonly placeholders: AuthFieldPlaceholders = AUTH_FIELD_PLACEHOLDERS;
  public readonly repeatPasswordField = input.required<FieldTree<string>>();
  public readonly showErrors = input.required<boolean>();
  public readonly submitLabel = input.required<string>();
  public readonly submittedForm = output<Event>();

  public onSubmit(event: Event): void {
    this.submittedForm.emit(event);
  }
}
