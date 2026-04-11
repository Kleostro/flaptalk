import { Injectable } from '@angular/core';
import {
  type Invite,
  type InvitePreview,
  type Message,
  type Room,
  type RoomReadState,
  type WorkspaceAccess,
  type WorkspaceCatchUpItem,
  type WorkspaceMember,
  type WorkspaceRoomActivity,
} from '@flaptalk/api-contract';
import { defer, from, map, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { api } from '@web/app/api.config';
import { type CreateInvite } from '@web/app/features/workspaces/types/create-invite.model';
import { type CreateMessage } from '@web/app/features/workspaces/types/create-message.model';
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

  public acceptInvite(token: string): Observable<WorkspaceAccess> {
    return this.createRequest$(
      () => api.invites({ token }).accept.post(),
      (response) => {
        if (response.data?.workspace) {
          return response.data;
        }

        throw new Error(
          this.getErrorMessage(response, 'Unable to accept the invite.', 'Sign in to accept it.'),
        );
      },
      'Unable to accept the invite.',
    );
  }

  public createInvite(workspaceId: number, invite: CreateInvite): Observable<Invite> {
    return this.createRequest$(
      () => {
        const normalizedEmail = invite.email.trim();
        const expiresInHours = Number(invite.expiresInHours.trim());

        return api.workspaces({ workspaceId }).invites.post({
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
          expiresInHours,
        });
      },
      (response) => {
        if (response.data?.id) {
          return response.data;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to create the invite.'));
      },
      'Unable to create the invite.',
    );
  }

  public createMessage(roomId: number, message: CreateMessage): Observable<Message> {
    return this.createRequest$(
      () =>
        api.rooms({ roomId }).messages.post({
          body: message.body.trim(),
          ...(message.parentMessageId === null ? {} : { parentMessageId: message.parentMessageId }),
        }),
      (response) => {
        if (response.data?.id) {
          return response.data;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to send the message.'));
      },
      'Unable to send the message.',
    );
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

  public getInvitePreview(token: string): Observable<InvitePreview> {
    return this.createRequest$(
      () => api.invites({ token }).get(),
      (response) => {
        if (response.data?.invite) {
          return response.data;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load the invite.'));
      },
      'Unable to load the invite.',
    );
  }

  public getMessageThread(messageId: number): Observable<{
    readonly replies: Message[];
    readonly rootMessage: Message;
  }> {
    return this.createRequest$(
      () => api.messages({ messageId }).thread.get(),
      (response) => {
        if (response.data) {
          return response.data;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load the thread.'));
      },
      'Unable to load the thread.',
    );
  }

  public getMyWorkspaces(): Observable<WorkspaceAccess[]> {
    return this.createRequest$(
      () => api.workspaces.me.get(),
      (response) => {
        if (response.data?.workspaces) {
          return response.data.workspaces;
        }

        if (response.status === UNAUTHORIZED_STATUS) {
          return [];
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load your workspaces.'));
      },
      'Unable to load your workspaces.',
    );
  }

  public getRoomMessages(roomId: number): Observable<Message[]> {
    return this.createRequest$(
      () => api.rooms({ roomId }).messages.get(),
      (response) => {
        if (response.data?.messages) {
          return response.data.messages;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load room messages.'));
      },
      'Unable to load room messages.',
    );
  }

  public getWorkspaceActivity(workspaceId: number): Observable<{
    readonly rooms: WorkspaceRoomActivity[];
    readonly unreadMessageCount: number;
    readonly unreadRoomCount: number;
  }> {
    return this.createRequest$(
      () => api.workspaces({ workspaceId }).activity.get(),
      (response) => {
        if (response.data?.rooms) {
          return response.data;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load workspace activity.'));
      },
      'Unable to load workspace activity.',
    );
  }

  public getWorkspaceCatchUp(workspaceId: number): Observable<{
    readonly items: WorkspaceCatchUpItem[];
    readonly primaryItem: null | WorkspaceCatchUpItem;
  }> {
    return this.createRequest$(
      () => api.workspaces({ workspaceId })['catch-up'].get(),
      (response) => {
        if (response.data?.items) {
          return response.data;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load workspace catch-up.'));
      },
      'Unable to load workspace catch-up.',
    );
  }

  public getWorkspaceInvites(workspaceId: number): Observable<Invite[]> {
    return this.createRequest$(
      () => api.workspaces({ workspaceId }).invites.get(),
      (response) => {
        if (response.data?.invites) {
          return response.data.invites;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load workspace invites.'));
      },
      'Unable to load workspace invites.',
    );
  }

  public getWorkspaceMembers(workspaceId: number): Observable<WorkspaceMember[]> {
    return this.createRequest$(
      () => api.workspaces({ workspaceId }).members.get(),
      (response) => {
        if (response.data?.members) {
          return response.data.members;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to load workspace members.'));
      },
      'Unable to load workspace members.',
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

  public leaveWorkspace(workspaceId: number): Observable<void> {
    return this.createRequest$(
      () => api.workspaces({ workspaceId }).members.me.delete(),
      (response) => {
        if (response.data?.success === true) {
          return void 0;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to leave the workspace.'));
      },
      'Unable to leave the workspace.',
    );
  }

  public removeWorkspaceMember(workspaceId: number, memberId: number): Observable<void> {
    return this.createRequest$(
      () => api.workspaces({ workspaceId }).members({ memberId }).delete(),
      (response) => {
        if (response.data?.success === true) {
          return void 0;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to remove the member.'));
      },
      'Unable to remove the member.',
    );
  }

  public revokeInvite(workspaceId: number, inviteId: number): Observable<void> {
    return this.createRequest$(
      () => api.workspaces({ workspaceId }).invites({ inviteId }).delete(),
      (response) => {
        if (response.data?.success === true) {
          return void 0;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to revoke the invite.'));
      },
      'Unable to revoke the invite.',
    );
  }

  public updateRoomReadState(roomId: number, lastReadMessageId: number): Observable<RoomReadState> {
    return this.createRequest$(
      () =>
        api.rooms({ roomId }).read.post({
          lastReadMessageId,
        }),
      (response) => {
        if (response.data?.roomId) {
          return response.data;
        }

        throw new Error(this.getErrorMessage(response, 'Unable to update room read progress.'));
      },
      'Unable to update room read progress.',
    );
  }
}
