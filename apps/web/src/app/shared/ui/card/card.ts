import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-card',
  styleUrl: './card.scss',
  templateUrl: './card.html',
})
export class CardComponent {}
