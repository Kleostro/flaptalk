import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { type KeyValueListItem } from '@web/app/shared/ui/key-value-list/key-value-list.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-key-value-list',
  styleUrl: './key-value-list.component.scss',
  templateUrl: './key-value-list.component.html',
})
export class KeyValueListComponent {
  public readonly items = input.required<readonly KeyValueListItem[]>();
}
