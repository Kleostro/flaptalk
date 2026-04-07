import { Injectable, signal, type WritableSignal } from '@angular/core';
import {
  email,
  type FieldTree,
  form,
  maxLength,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';

import { AUTH_FORM_LIMITS } from '@web/app/features/auth/constants/auth.constants';
import { type LoginCredentials } from '@web/app/features/auth/types/login-credentials.model';
import { type RegistrationCredentials } from '@web/app/features/auth/types/registration-credentials.model';

const HAS_UPPERCASE_CHARACTER_PATTERN = /[A-Z]/u;
const HAS_LOWERCASE_CHARACTER_PATTERN = /[a-z]/u;
const HAS_NUMBER_OR_SYMBOL_PATTERN = /[\d\W_]/u;

@Injectable({ providedIn: 'root' })
export class AuthFormFactoryService {
  public createLoginForm(model: WritableSignal<LoginCredentials>): FieldTree<LoginCredentials> {
    return form(model, (path) => {
      required(path.email, { message: 'Email is required.' });
      email(path.email, { message: 'Enter a valid email address.' });

      required(path.password, { message: 'Password is required.' });
      minLength(path.password, AUTH_FORM_LIMITS.passwordMinLength, {
        message: `Use at least ${AUTH_FORM_LIMITS.passwordMinLength} characters.`,
      });
      maxLength(path.password, AUTH_FORM_LIMITS.passwordMaxLength, {
        message: `Use no more than ${AUTH_FORM_LIMITS.passwordMaxLength} characters.`,
      });
    });
  }

  public createLoginModel(): WritableSignal<LoginCredentials> {
    return signal({
      email: '',
      password: '',
    });
  }

  public createRegistrationForm(
    model: WritableSignal<RegistrationCredentials>,
  ): FieldTree<RegistrationCredentials> {
    return form(model, (path) => {
      required(path.email, { message: 'Email is required.' });
      email(path.email, { message: 'Enter a valid email address.' });

      required(path.password, { message: 'Password is required.' });
      minLength(path.password, AUTH_FORM_LIMITS.passwordMinLength, {
        message: `Use at least ${AUTH_FORM_LIMITS.passwordMinLength} characters.`,
      });
      maxLength(path.password, AUTH_FORM_LIMITS.passwordMaxLength, {
        message: `Use no more than ${AUTH_FORM_LIMITS.passwordMaxLength} characters.`,
      });
      pattern(path.password, HAS_UPPERCASE_CHARACTER_PATTERN, {
        message: 'Include at least one uppercase letter.',
      });
      pattern(path.password, HAS_LOWERCASE_CHARACTER_PATTERN, {
        message: 'Include at least one lowercase letter.',
      });
      pattern(path.password, HAS_NUMBER_OR_SYMBOL_PATTERN, {
        message: 'Include at least one number or symbol.',
      });

      required(path.confirmPassword, { message: 'Confirm your password.' });
      minLength(path.confirmPassword, AUTH_FORM_LIMITS.passwordMinLength, {
        message: `Use at least ${AUTH_FORM_LIMITS.passwordMinLength} characters.`,
      });
      maxLength(path.confirmPassword, AUTH_FORM_LIMITS.passwordMaxLength, {
        message: `Use no more than ${AUTH_FORM_LIMITS.passwordMaxLength} characters.`,
      });
    });
  }

  public createRegistrationModel(): WritableSignal<RegistrationCredentials> {
    return signal({
      confirmPassword: '',
      email: '',
      password: '',
    });
  }
}
