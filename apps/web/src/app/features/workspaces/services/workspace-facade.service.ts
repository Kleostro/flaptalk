import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { type Room, type WorkspaceAccess } from '@flaptalk/api-contract';
import { finalize, map, Observable, of, tap } from 'rxjs';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
import { type AuthSubmissionResult } from '@web/app/features/auth/models/auth-submission-result.model';
import { WorkspaceApiService } from '@web/app/features/workspaces/services/workspace-api.service';
import { type CreateRoom } from '@web/app/features/workspaces/types/create-room.model';
import { type CreateWorkspace } from '@web/app/features/workspaces/types/create-workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceFacadeService {
  private readonly createRoomPendingState = signal(false);
  private readonly createWorkspacePendingState = signal(false);
  private readonly roomRequestVersion = signal(0);
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
  private readonly roomCollectionResource = rxResource<
    Room[],
    { readonly version: number; readonly workspaceId: null | number }
  >({
    defaultValue: [],
    params: () => ({
      version: this.roomRequestVersion(),
      workspaceId: this.currentWorkspace()?.id ?? null,
    }),
    stream: ({ params }) =>
      params.workspaceId === null
        ? of([])
        : this.workspaceApiService.getWorkspaceRooms(params.workspaceId),
  });

  public readonly currentWorkspaceRole = computed(
    () => this.currentWorkspaceAccess()?.role ?? null,
  );
  public readonly canManageRooms = computed(() => this.currentWorkspaceRole() === 'owner');
  public readonly rooms = computed(() => this.roomCollectionResource.value());
  public readonly roomCount = computed(() => this.rooms().length);
  public readonly hasRooms = computed(() => this.roomCount() > 0);
  public readonly hasWorkspace = computed(() => this.currentWorkspace() !== null);
  public readonly isCreateRoomPending = computed(() => this.createRoomPendingState());
  public readonly isCreateWorkspacePending = computed(() => this.createWorkspacePendingState());
  public readonly isRoomCollectionPending = computed(() => this.roomCollectionResource.isLoading());
  public readonly isWorkspaceCollectionPending = computed(() =>
    this.workspaceCollectionResource.isLoading(),
  );

  public createRoom(workspaceId: number, room: CreateRoom): Observable<AuthSubmissionResult> {
    this.createRoomPendingState.set(true);

    return this.workspaceApiService.createRoom(workspaceId, room).pipe(
      tap((createdRoom) => {
        this.roomCollectionResource.set([...this.rooms(), createdRoom]);
      }),
      map((createdRoom) => ({
        level: TOAST_LEVEL.success,
        message: `"${createdRoom.name}" is ready for its first discussions.`,
        title: 'Room created',
      })),
      finalize(() => {
        this.createRoomPendingState.set(false);
      }),
    );
  }

  public createWorkspace(workspace: CreateWorkspace): Observable<AuthSubmissionResult> {
    this.createWorkspacePendingState.set(true);

    return this.workspaceApiService.createWorkspace(workspace).pipe(
      tap((createdWorkspaceAccess) => {
        this.workspaceCollectionResource.set([createdWorkspaceAccess, ...this.workspaces()]);
        this.roomCollectionResource.set([]);
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

  public refreshRooms(): void {
    this.roomRequestVersion.update((version) => version + 1);
  }

  public refreshWorkspaces(): void {
    this.workspaceRequestVersion.update((version) => version + 1);
  }
}
