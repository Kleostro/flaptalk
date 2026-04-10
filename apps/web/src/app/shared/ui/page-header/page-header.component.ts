import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  type BreadcrumbItem,
  BreadcrumbsComponent,
} from '@web/app/shared/ui/breadcrumbs/breadcrumbs.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BreadcrumbsComponent],
  selector: 'app-page-header',
  styleUrl: './page-header.component.scss',
  templateUrl: './page-header.component.html',
})
export class PageHeaderComponent {
  public readonly breadcrumbs = input<null | readonly BreadcrumbItem[]>(null);
  public readonly description = input.required<string>();
  public readonly kicker = input.required<string>();
  public readonly title = input.required<string>();
}
