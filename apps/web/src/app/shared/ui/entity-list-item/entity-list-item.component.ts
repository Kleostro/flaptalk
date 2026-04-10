import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-entity-list-item',
  styleUrl: './entity-list-item.component.scss',
  templateUrl: './entity-list-item.component.html',
})
export class EntityListItemComponent {
  public readonly stackOnMobile = input(true);
}
