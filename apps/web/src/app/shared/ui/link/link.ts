import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LINK_APPEARANCE, type LinkAppearance } from '@web/app/shared/ui/link/link.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-link',
  styleUrl: './link.scss',
  templateUrl: './link.html',
})
export class LinkComponent {
  public readonly appearance = input<LinkAppearance>(LINK_APPEARANCE.inline);
  public readonly ariaLabel = input<null | string>(null);
  public readonly route = input.required<string>();
}
