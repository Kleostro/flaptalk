import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  readonly href: null | readonly string[];
  readonly label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-breadcrumbs',
  styleUrl: './breadcrumbs.component.scss',
  templateUrl: './breadcrumbs.component.html',
})
export class BreadcrumbsComponent {
  public readonly items = input.required<readonly BreadcrumbItem[]>();
  public readonly mobileBackItem = computed<BreadcrumbItem | null>(() => {
    const breadcrumbItems = this.items();

    if (breadcrumbItems.length < 2) {
      return null;
    }

    return breadcrumbItems[breadcrumbItems.length - 2] ?? null;
  });
}
