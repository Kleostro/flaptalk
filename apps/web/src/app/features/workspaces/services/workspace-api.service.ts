import { Injectable } from '@angular/core';
import { type Room, type WorkspaceAccess } from '@flaptalk/api-contract';
import { defer, from, map, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { api } from '@web/app/api.config';
import { type CreateRoom } from '@web/app/features/workspaces/types/create-room.model';
import { type CreateWorkspace } from '@web/app/features/workspaces/types/create-workspace.model';

const UNAUTHORIZED_STATUS = 401;

interface ApiErrorValue {
  readonly message?: string;
  readonly summary?: string;
}

interface ApiResponse<TData> {
  readonly data?: TData;
  readonly error?: null | {
    readonly status?: number;
    readonly value?: ApiErrorValue;
  };
  readonly status?: number;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceApiService {
  private createRequest$<TData, TResult>(
    request: () => Promise<ApiResponse<TData>>,
    project: (response: ApiResponse<TData>) => TResult,
    fallbackMessage: string,
  ): Observable<TResult> {
    return defer(() => from(request())).pipe(
      map(project),
      catchError((error: unknown) =>
        throwError(() => (error instanceof Error ? error : new Error(fallbackMessage))),
      ),
    );
  }

  private getErrorMessage(
    response: ApiResponse<unknown>,
    fallbackMessage: string,
    defaultUnauthorizedMessage = 'Authentication is required.',
  ): string {
    if (response.error?.value?.message) {
      return response.error.value.message;
    }

    if (response.error?.value?.summary) {
      return response.error.value.summary;
    }

    if (response.status === UNAUTHORIZED_STATUS) {
      return defaultUnauthorizedMessage;
    }

    return fallbackMessage;
  }

  public createRoom(workspaceId: number, room: CreateRoom): Observable<Room> {
    return this.createRequest$(
      () => {
        const normalizedDescription = room.description.trim();

        return api.workspaces({ workspaceId }).rooms.post({
          ...(normalizedDescription ? { description: normalizedDescription } : {}),
          name: room.name.trim(),
        });
      },
      (response) => {
        if (response.data?.id) {
          return response.data;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to create the room.'));
      },
      'Unable to create the room.',
    );
  }

  public createWorkspace(workspace: CreateWorkspace): Observable<WorkspaceAccess> {
    return this.createRequest$(
      () => {
        const normalizedDescription = workspace.description.trim();

        return api.workspaces.post({
          ...(normalizedDescription ? { description: normalizedDescription } : {}),
          name: workspace.name.trim(),
        });
      },
      (response) => {
        if (response.data?.workspace) {
          return response.data;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to create the workspace.'));
      },
      'Unable to create the workspace.',
    );
  }

  public getMyWorkspaces(): Observable<WorkspaceAccess[]> {
    return this.createRequest$(
      () => api.workspaces.me.get(),
      (response) => {
        if (response.data?.workspaces) {
          return response.data.workspaces;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load your workspaces.'));
      },
      'Unable to load your workspaces.',
    );
  }

  public getWorkspaceRooms(workspaceId: number): Observable<Room[]> {
    return this.createRequest$(
      () => api.workspaces({ workspaceId }).rooms.get(),
      (response) => {
        if (response.data?.rooms) {
          return response.data.rooms;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load workspace rooms.'));
      },
      'Unable to load workspace rooms.',
    );
  }
}
