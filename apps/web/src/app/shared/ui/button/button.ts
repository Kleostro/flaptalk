import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  BUTTON_APPEARANCE,
  BUTTON_SIZE,
  BUTTON_TYPE,
  type ButtonAppearance,
  type ButtonSize,
  type ButtonType,
} from '@web/app/shared/ui/button/button.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-button',
  styleUrl: './button.scss',
  templateUrl: './button.html',
})
export class ButtonComponent {
  public readonly appearance = input<ButtonAppearance>(BUTTON_APPEARANCE.primary);
  public readonly disabled = input(false);
  public readonly fluid = input(false);
  public readonly size = input<ButtonSize>(BUTTON_SIZE.large);
  public readonly type = input<ButtonType>(BUTTON_TYPE.button);
}
