import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { ToastService } from '@web/app/core/services/toast.service';
import { AuthFacadeService } from '@web/app/features/auth/services/auth-facade.service';
import { WorkspaceFacadeService } from '@web/app/features/workspaces/services/workspace-facade.service';
import { AppShellComponent } from '@web/app/shared/ui/app-shell/app-shell';
import {
  type BreadcrumbItem,
  BreadcrumbsComponent,
} from '@web/app/shared/ui/breadcrumbs/breadcrumbs.component';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { CardComponent } from '@web/app/shared/ui/card/card';
import { LinkComponent } from '@web/app/shared/ui/link/link';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppShellComponent,
    BreadcrumbsComponent,
    ButtonComponent,
    CardComponent,
    DatePipe,
    LinkComponent,
  ],
  selector: 'app-workspace-invite-page',
  styleUrl: './workspace-invite-page.component.scss',
  templateUrl: './workspace-invite-page.component.html',
})
export class WorkspaceInvitePageComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly workspaceFacadeService = inject(WorkspaceFacadeService);
  public readonly authStatus = computed(() => this.authFacadeService.status());
  public readonly invitePreview = computed(() => this.workspaceFacadeService.invitePreview());
  public readonly breadcrumbs = computed<readonly BreadcrumbItem[]>(() => [
    {
      href: ['/', APP_ROUTE_PATHS.login],
      label: 'Access',
    },
    {
      href: null,
      label: this.invitePreview()?.workspace.name ?? 'Invite',
    },
  ]);

  public readonly isAcceptPending = computed(() =>
    this.workspaceFacadeService.isAcceptInvitePending(),
  );
  public readonly isInvitePreviewPending = computed(() =>
    this.workspaceFacadeService.isInvitePreviewPending(),
  );
  public readonly loginRoute = `/${APP_ROUTE_PATHS.login}`;
  public readonly redirectQueryParams = computed<Params>(() => ({
    redirectTo: this.router.url,
  }));
  public readonly registerRoute = `/${APP_ROUTE_PATHS.register}`;

  constructor() {
    this.activatedRoute.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.workspaceFacadeService.setInvitePreviewToken(params.get('token'));
    });
  }

  public acceptInvite(): void {
    const token = this.activatedRoute.snapshot.paramMap.get('token');

    if (!token) {
      this.toastService.error({
        message: 'We could not resolve this invite token.',
        title: 'Invite unavailable',
      });
      return;
    }

    this.workspaceFacadeService
      .acceptInvite(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.toastService.error({
            message:
              error instanceof Error
                ? error.message
                : 'We could not accept this invite. Please try again.',
            title: 'Invite acceptance failed',
          });
        },
        next: (result) => {
          this.toastService.success(result);
          void this.router.navigateByUrl(`/${APP_ROUTE_PATHS.workspace}`);
        },
      });
  }
}
