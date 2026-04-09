import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { type WorkspaceAccess } from '@flaptalk/api-contract';
import { finalize, map, Observable, tap } from 'rxjs';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
import { type AuthSubmissionResult } from '@web/app/features/auth/models/auth-submission-result.model';
import { WorkspaceApiService } from '@web/app/features/workspaces/services/workspace-api.service';
import { type CreateWorkspace } from '@web/app/features/workspaces/types/create-workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceFacadeService {
  private readonly createWorkspacePendingState = signal(false);
  private readonly workspaceApiService = inject(WorkspaceApiService);
  private readonly workspaceRequestVersion = signal(0);
  private readonly workspaceCollectionResource = rxResource<WorkspaceAccess[], number>({
    defaultValue: [],
    params: () => this.workspaceRequestVersion(),
    stream: () => this.workspaceApiService.getMyWorkspaces(),
  });

  public readonly workspaces = computed(() => this.workspaceCollectionResource.value());
  public readonly currentWorkspaceAccess = computed(() => this.workspaces()[0] ?? null);
  public readonly currentWorkspace = computed(
    () => this.currentWorkspaceAccess()?.workspace ?? null,
  );
  public readonly currentWorkspaceRole = computed(
    () => this.currentWorkspaceAccess()?.role ?? null,
  );
  public readonly hasWorkspace = computed(() => this.currentWorkspace() !== null);
  public readonly isCreateWorkspacePending = computed(() => this.createWorkspacePendingState());
  public readonly isWorkspaceCollectionPending = computed(() =>
    this.workspaceCollectionResource.isLoading(),
  );

  public createWorkspace(workspace: CreateWorkspace): Observable<AuthSubmissionResult> {
    this.createWorkspacePendingState.set(true);

    return this.workspaceApiService.createWorkspace(workspace).pipe(
      tap((createdWorkspaceAccess) => {
        this.workspaceCollectionResource.set([createdWorkspaceAccess, ...this.workspaces()]);
      }),
      map((createdWorkspaceAccess) => ({
        level: TOAST_LEVEL.success,
        message: `"${createdWorkspaceAccess.workspace.name}" is ready. You can start shaping the space now.`,
        title: 'Workspace created',
      })),
      finalize(() => {
        this.createWorkspacePendingState.set(false);
      }),
    );
  }

  public refreshWorkspaces(): void {
    this.workspaceRequestVersion.update((version) => version + 1);
  }
}
