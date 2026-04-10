import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  type Message,
  type Room,
  type RoomReadState,
  type WorkspaceAccess,
  type WorkspaceRoomActivity,
} from '@flaptalk/api-contract';
import { finalize, map, Observable, of, tap } from 'rxjs';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
import { type AuthSubmissionResult } from '@web/app/features/auth/models/auth-submission-result.model';
import { WorkspaceApiService } from '@web/app/features/workspaces/services/workspace-api.service';
import { type CreateMessage } from '@web/app/features/workspaces/types/create-message.model';
import { type CreateRoom } from '@web/app/features/workspaces/types/create-room.model';
import { type CreateWorkspace } from '@web/app/features/workspaces/types/create-workspace.model';

interface WorkspaceActivityState {
  readonly rooms: readonly WorkspaceRoomActivity[];
  readonly unreadMessageCount: number;
  readonly unreadRoomCount: number;
}

const EMPTY_WORKSPACE_ACTIVITY: WorkspaceActivityState = {
  rooms: [],
  unreadMessageCount: 0,
  unreadRoomCount: 0,
};

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
  private readonly readStateRequestVersion = signal(0);
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
  private readonly workspaceActivityResource = rxResource<
    WorkspaceActivityState,
    { readonly version: number; readonly workspaceId: null | number }
  >({
    defaultValue: EMPTY_WORKSPACE_ACTIVITY,
    params: () => ({
      version: this.readStateRequestVersion(),
      workspaceId: this.currentWorkspace()?.id ?? null,
    }),
    stream: ({ params }) =>
      params.workspaceId === null
        ? of(EMPTY_WORKSPACE_ACTIVITY)
        : this.workspaceApiService.getWorkspaceActivity(params.workspaceId),
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
  public readonly isWorkspaceActivityPending = computed(() =>
    this.workspaceActivityResource.isLoading(),
  );
  public readonly isWorkspaceCollectionPending = computed(() =>
    this.workspaceCollectionResource.isLoading(),
  );
  public readonly selectedThreadReplies = computed(() => this.selectedThread()?.replies ?? []);
  public readonly workspaceActivity = computed(() => this.workspaceActivityResource.value());
  public readonly unreadMessageCount = computed(() => this.workspaceActivity().unreadMessageCount);
  public readonly unreadMessageCountByRoomId = computed(() => {
    const roomActivityEntries = this.workspaceActivity().rooms.map(
      (roomActivity) => [roomActivity.room.id, roomActivity.unreadMessageCount] as const,
    );

    return new Map<number, number>(roomActivityEntries);
  });
  public readonly unreadRoomCount = computed(() => this.workspaceActivity().unreadRoomCount);

  private computeWorkspaceActivityTotals(
    rooms: readonly WorkspaceRoomActivity[],
  ): WorkspaceActivityState {
    return {
      rooms,
      unreadMessageCount: rooms.reduce(
        (count, roomActivity) => count + roomActivity.unreadMessageCount,
        0,
      ),
      unreadRoomCount: rooms.filter((roomActivity) => roomActivity.unreadMessageCount > 0).length,
    };
  }

  private updateWorkspaceActivityRoom(
    roomId: number,
    updateRoomActivity: (roomActivity: WorkspaceRoomActivity) => WorkspaceRoomActivity,
  ): void {
    const updatedRooms = this.workspaceActivity().rooms.map((roomActivity) =>
      roomActivity.room.id === roomId ? updateRoomActivity(roomActivity) : roomActivity,
    );

    this.workspaceActivityResource.set(this.computeWorkspaceActivityTotals(updatedRooms));
  }

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
        } else {
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
        }

        this.updateWorkspaceActivityRoom(roomId, (roomActivity) => ({
          ...roomActivity,
          lastMessage: createdMessage,
          readState: {
            lastReadMessageId: createdMessage.id,
            roomId,
            updatedAt: new Date().toISOString(),
            userId: createdMessage.author.id,
          },
          unreadMessageCount: 0,
        }));
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
        this.workspaceActivityResource.set(
          this.computeWorkspaceActivityTotals([
            ...this.workspaceActivity().rooms,
            {
              lastMessage: null,
              readState: null,
              room: createdRoom,
              unreadMessageCount: 0,
            },
          ]),
        );
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
        this.workspaceActivityResource.set(EMPTY_WORKSPACE_ACTIVITY);
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

  public getSelectedRoomReadState(): null | RoomReadState {
    const selectedRoomId = this.selectedRoom()?.id;

    if (!selectedRoomId) {
      return null;
    }

    return (
      this.workspaceActivity().rooms.find((roomActivity) => roomActivity.room.id === selectedRoomId)
        ?.readState ?? null
    );
  }

  public getSelectedRoomUnreadCount(): number {
    const selectedRoomId = this.selectedRoom()?.id;

    if (!selectedRoomId) {
      return 0;
    }

    return this.unreadMessageCountByRoomId().get(selectedRoomId) ?? 0;
  }

  public markRoomRead(roomId: number, lastReadMessageId: number): Observable<void> {
    const currentRoomActivity = this.workspaceActivity().rooms.find(
      (roomActivity) => roomActivity.room.id === roomId,
    );
    const currentLastReadMessageId = currentRoomActivity?.readState?.lastReadMessageId ?? null;

    if (currentLastReadMessageId !== null && currentLastReadMessageId >= lastReadMessageId) {
      return of(void 0);
    }

    return this.workspaceApiService.updateRoomReadState(roomId, lastReadMessageId).pipe(
      tap((readState) => {
        this.updateWorkspaceActivityRoom(roomId, (roomActivity) => ({
          ...roomActivity,
          readState,
          unreadMessageCount: roomActivity.lastMessage?.id
            ? roomActivity.lastMessage.id > (readState.lastReadMessageId ?? 0)
              ? roomActivity.unreadMessageCount
              : 0
            : 0,
        }));
      }),
      map(() => void 0),
    );
  }

  public refreshMessages(): void {
    this.messageRequestVersion.update((version) => version + 1);
  }

  public refreshReadState(): void {
    this.readStateRequestVersion.update((version) => version + 1);
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
