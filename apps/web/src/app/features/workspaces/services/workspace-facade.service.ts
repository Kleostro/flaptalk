import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { type Message, type Room, type WorkspaceAccess } from '@flaptalk/api-contract';
import { finalize, map, Observable, of, tap } from 'rxjs';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
import { type AuthSubmissionResult } from '@web/app/features/auth/models/auth-submission-result.model';
import { WorkspaceApiService } from '@web/app/features/workspaces/services/workspace-api.service';
import { type CreateMessage } from '@web/app/features/workspaces/types/create-message.model';
import { type CreateRoom } from '@web/app/features/workspaces/types/create-room.model';
import { type CreateWorkspace } from '@web/app/features/workspaces/types/create-workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceFacadeService {
  private readonly createMessagePendingState = signal(false);
  private readonly createRoomPendingState = signal(false);
  private readonly createWorkspacePendingState = signal(false);
  private readonly messageRequestVersion = signal(0);
  private readonly workspaceApiService = inject(WorkspaceApiService);
  private readonly selectedRoomIdState = signal<null | number>(null);
  private readonly roomRequestVersion = signal(0);
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
  public readonly rooms = computed(() => this.roomCollectionResource.value());
  public readonly selectedRoom = computed(() => {
    const selectedRoomId = this.selectedRoomIdState();

    if (selectedRoomId === null) {
      return null;
    }

    return this.rooms().find((room) => room.id === selectedRoomId) ?? null;
  });

  private readonly messageCollectionResource = rxResource<
    Message[],
    { readonly roomId: null | number; readonly version: number }
  >({
    defaultValue: [],
    params: () => ({
      roomId: this.selectedRoom()?.id ?? null,
      version: this.messageRequestVersion(),
    }),
    stream: ({ params }) =>
      params.roomId === null ? of([]) : this.workspaceApiService.getRoomMessages(params.roomId),
  });
  private readonly selectedThreadMessageIdState = signal<null | number>(null);
  private readonly threadRequestVersion = signal(0);
  private readonly threadResource = rxResource<
    null | { readonly replies: Message[]; readonly rootMessage: Message },
    { readonly messageId: null | number; readonly version: number }
  >({
    defaultValue: null,
    params: () => ({
      messageId: this.selectedThreadMessageIdState(),
      version: this.threadRequestVersion(),
    }),
    stream: ({ params }) =>
      params.messageId === null
        ? of(null)
        : this.workspaceApiService.getMessageThread(params.messageId),
  });
  public readonly currentWorkspaceRole = computed(
    () => this.currentWorkspaceAccess()?.role ?? null,
  );
  public readonly canManageRooms = computed(() => this.currentWorkspaceRole() === 'owner');

  public readonly messages = computed(() => this.messageCollectionResource.value());
  public readonly messageCount = computed(() => this.messages().length);
  public readonly hasMessages = computed(() => this.messageCount() > 0);
  public readonly roomCount = computed(() => this.rooms().length);
  public readonly hasRooms = computed(() => this.roomCount() > 0);
  public readonly selectedThread = computed(() => this.threadResource.value());
  public readonly selectedThreadRootMessage = computed(
    () => this.selectedThread()?.rootMessage ?? null,
  );
  public readonly hasSelectedThread = computed(() => this.selectedThreadRootMessage() !== null);
  public readonly hasWorkspace = computed(() => this.currentWorkspace() !== null);
  public readonly isCreateMessagePending = computed(() => this.createMessagePendingState());
  public readonly isCreateRoomPending = computed(() => this.createRoomPendingState());
  public readonly isCreateWorkspacePending = computed(() => this.createWorkspacePendingState());
  public readonly isMessageCollectionPending = computed(() =>
    this.messageCollectionResource.isLoading(),
  );
  public readonly isRoomCollectionPending = computed(() => this.roomCollectionResource.isLoading());
  public readonly isThreadPending = computed(() => this.threadResource.isLoading());
  public readonly isWorkspaceCollectionPending = computed(() =>
    this.workspaceCollectionResource.isLoading(),
  );
  public readonly selectedThreadReplies = computed(() => this.selectedThread()?.replies ?? []);

  public clearSelectedRoom(): void {
    this.clearSelectedThread();
    this.selectedRoomIdState.set(null);
  }

  public clearSelectedThread(): void {
    this.selectedThreadMessageIdState.set(null);
  }

  public createMessage(roomId: number, message: CreateMessage): Observable<AuthSubmissionResult> {
    this.createMessagePendingState.set(true);

    return this.workspaceApiService.createMessage(roomId, message).pipe(
      tap((createdMessage) => {
        if (createdMessage.parentMessageId === null) {
          this.messageCollectionResource.set([...this.messages(), createdMessage]);
          return;
        }

        const selectedThreadRootMessage = this.selectedThreadRootMessage();

        if (selectedThreadRootMessage?.id === createdMessage.parentMessageId) {
          const selectedThread = this.selectedThread();

          if (selectedThread) {
            this.threadResource.set({
              replies: [...selectedThread.replies, createdMessage],
              rootMessage: selectedThread.rootMessage,
            });
          }
        }
      }),
      map(() => ({
        level: TOAST_LEVEL.success,
        message: 'Your message is now part of the room feed.',
        title: 'Message sent',
      })),
      finalize(() => {
        this.createMessagePendingState.set(false);
      }),
    );
  }

  public createRoom(workspaceId: number, room: CreateRoom): Observable<AuthSubmissionResult> {
    this.createRoomPendingState.set(true);

    return this.workspaceApiService.createRoom(workspaceId, room).pipe(
      tap((createdRoom) => {
        this.roomCollectionResource.set([...this.rooms(), createdRoom]);
        this.clearSelectedThread();
        this.selectedRoomIdState.set(createdRoom.id);
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
        this.messageCollectionResource.set([]);
        this.roomCollectionResource.set([]);
        this.selectedRoomIdState.set(null);
        this.threadResource.set(null);
        this.selectedThreadMessageIdState.set(null);
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

  public refreshMessages(): void {
    this.messageRequestVersion.update((version) => version + 1);
  }

  public refreshRooms(): void {
    this.roomRequestVersion.update((version) => version + 1);
  }

  public refreshThread(): void {
    this.threadRequestVersion.update((version) => version + 1);
  }

  public refreshWorkspaces(): void {
    this.workspaceRequestVersion.update((version) => version + 1);
  }

  public selectRoom(roomId: number): void {
    this.clearSelectedThread();
    this.selectedRoomIdState.set(roomId);
  }

  public selectThread(messageId: number): void {
    this.selectedThreadMessageIdState.set(messageId);
  }
}
