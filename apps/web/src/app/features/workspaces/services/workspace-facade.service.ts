import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
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
import { finalize, map, Observable, of, tap } from 'rxjs';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
import { type AuthSubmissionResult } from '@web/app/features/auth/models/auth-submission-result.model';
import { AuthFacadeService } from '@web/app/features/auth/services/auth-facade.service';
import { WorkspaceApiService } from '@web/app/features/workspaces/services/workspace-api.service';
import { type CreateInvite } from '@web/app/features/workspaces/types/create-invite.model';
import { type CreateMessage } from '@web/app/features/workspaces/types/create-message.model';
import { type CreateRoom } from '@web/app/features/workspaces/types/create-room.model';
import { type CreateWorkspace } from '@web/app/features/workspaces/types/create-workspace.model';
import { type WorkspaceMemberRow } from '@web/app/features/workspaces/types/workspace-member-row.model';

interface WorkspaceActivityState {
  readonly rooms: readonly WorkspaceRoomActivity[];
  readonly unreadMessageCount: number;
  readonly unreadRoomCount: number;
}

interface WorkspaceCatchUpState {
  readonly items: readonly WorkspaceCatchUpItem[];
  readonly primaryItem: null | WorkspaceCatchUpItem;
}

const EMPTY_WORKSPACE_ACTIVITY: WorkspaceActivityState = {
  rooms: [],
  unreadMessageCount: 0,
  unreadRoomCount: 0,
};

const EMPTY_WORKSPACE_CATCH_UP: WorkspaceCatchUpState = {
  items: [],
  primaryItem: null,
};

@Injectable({ providedIn: 'root' })
export class WorkspaceFacadeService {
  private readonly acceptInvitePendingState = signal(false);
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly catchUpRequestVersion = signal(0);
  private readonly createInvitePendingState = signal(false);
  private readonly createMessagePendingState = signal(false);
  private readonly createRoomPendingState = signal(false);
  private readonly createWorkspacePendingState = signal(false);
  private readonly inviteRequestVersion = signal(0);
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
  private readonly inviteCollectionResource = rxResource<
    Invite[],
    {
      readonly version: number;
      readonly workspaceId: null | number;
      readonly workspaceRole: null | WorkspaceAccess['role'];
    }
  >({
    defaultValue: [],
    params: () => ({
      version: this.inviteRequestVersion(),
      workspaceId: this.currentWorkspace()?.id ?? null,
      workspaceRole: this.currentWorkspaceRole(),
    }),
    stream: ({ params }) =>
      params.workspaceId === null || params.workspaceRole !== 'owner'
        ? of([])
        : this.workspaceApiService.getWorkspaceInvites(params.workspaceId),
  });
  private readonly invitePreviewRequestVersion = signal(0);
  private readonly inviteTokenState = signal<null | string>(null);
  private readonly invitePreviewResource = rxResource<
    InvitePreview | null,
    { readonly token: null | string; readonly version: number }
  >({
    defaultValue: null,
    params: () => ({
      token: this.inviteTokenState(),
      version: this.invitePreviewRequestVersion(),
    }),
    stream: ({ params }) =>
      params.token === null ? of(null) : this.workspaceApiService.getInvitePreview(params.token),
  });
  private readonly memberRequestVersion = signal(0);
  private readonly memberCollectionResource = rxResource<
    WorkspaceMember[],
    { readonly version: number; readonly workspaceId: null | number }
  >({
    defaultValue: [],
    params: () => ({
      version: this.memberRequestVersion(),
      workspaceId: this.currentWorkspace()?.id ?? null,
    }),
    stream: ({ params }) =>
      params.workspaceId === null
        ? of([])
        : this.workspaceApiService.getWorkspaceMembers(params.workspaceId),
  });
  private readonly messageRequestVersion = signal(0);
  private readonly selectedRoomIdState = signal<null | number>(null);
  private readonly roomRequestVersion = signal(0);
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
  private readonly removeMemberPendingState = signal<null | number>(null);
  private readonly revokeInvitePendingState = signal<null | number>(null);
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
  private readonly workspaceCatchUpResource = rxResource<
    WorkspaceCatchUpState,
    { readonly version: number; readonly workspaceId: null | number }
  >({
    defaultValue: EMPTY_WORKSPACE_CATCH_UP,
    params: () => ({
      version: this.catchUpRequestVersion(),
      workspaceId: this.currentWorkspace()?.id ?? null,
    }),
    stream: ({ params }) =>
      params.workspaceId === null
        ? of(EMPTY_WORKSPACE_CATCH_UP)
        : this.workspaceApiService.getWorkspaceCatchUp(params.workspaceId),
  });

  public readonly invites = computed(() => this.inviteCollectionResource.value());
  public readonly activeInviteCount = computed(
    () => this.invites().filter((invite) => invite.usedAt === null).length,
  );
  public readonly canManageInvites = computed(() => this.currentWorkspaceRole() === 'owner');
  public readonly canManageRooms = computed(() => this.currentWorkspaceRole() === 'owner');
  public readonly workspaceCatchUp = computed(() => this.workspaceCatchUpResource.value());
  public readonly catchUpItems = computed(() => this.workspaceCatchUp().items);
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
  public readonly inviteCount = computed(() => this.invites().length);
  public readonly invitePreview = computed(() => this.invitePreviewResource.value());
  public readonly isAcceptInvitePending = computed(() => this.acceptInvitePendingState());
  public readonly isCreateInvitePending = computed(() => this.createInvitePendingState());
  public readonly isCreateMessagePending = computed(() => this.createMessagePendingState());
  public readonly isCreateRoomPending = computed(() => this.createRoomPendingState());
  public readonly isCreateWorkspacePending = computed(() => this.createWorkspacePendingState());
  public readonly isInviteCollectionPending = computed(() =>
    this.inviteCollectionResource.isLoading(),
  );
  public readonly isInvitePreviewPending = computed(() => this.invitePreviewResource.isLoading());
  public readonly isInviteRevokePending = computed(() => this.revokeInvitePendingState() !== null);
  public readonly isMemberCollectionPending = computed(() =>
    this.memberCollectionResource.isLoading(),
  );
  public readonly isMemberRemovalPending = computed(() => this.removeMemberPendingState() !== null);
  public readonly isMessageCollectionPending = computed(() =>
    this.messageCollectionResource.isLoading(),
  );
  public readonly isRoomCollectionPending = computed(() => this.roomCollectionResource.isLoading());
  public readonly isThreadPending = computed(() => this.threadResource.isLoading());
  public readonly isWorkspaceActivityPending = computed(() =>
    this.workspaceActivityResource.isLoading(),
  );
  public readonly isWorkspaceCatchUpPending = computed(() =>
    this.workspaceCatchUpResource.isLoading(),
  );
  public readonly isWorkspaceCollectionPending = computed(() =>
    this.workspaceCollectionResource.isLoading(),
  );
  public readonly members = computed<WorkspaceMemberRow[]>(() => {
    const authenticatedUserId = this.authFacadeService.user()?.id ?? null;

    return this.memberCollectionResource.value().map((member) => ({
      ...member,
      isCurrentUser: member.user.id === authenticatedUserId,
    }));
  });
  public readonly memberCount = computed(() => this.members().length);
  public readonly primaryCatchUpItem = computed(() => this.workspaceCatchUp().primaryItem);
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

  private refreshWorkspaceContextData(): void {
    this.roomRequestVersion.update((version) => version + 1);
    this.inviteRequestVersion.update((version) => version + 1);
    this.memberRequestVersion.update((version) => version + 1);
    this.readStateRequestVersion.update((version) => version + 1);
    this.catchUpRequestVersion.update((version) => version + 1);
  }

  private resetWorkspaceContextState(): void {
    this.inviteCollectionResource.set([]);
    this.memberCollectionResource.set([]);
    this.messageCollectionResource.set([]);
    this.roomCollectionResource.set([]);
    this.selectedRoomIdState.set(null);
    this.threadResource.set(null);
    this.selectedThreadMessageIdState.set(null);
    this.workspaceActivityResource.set(EMPTY_WORKSPACE_ACTIVITY);
    this.workspaceCatchUpResource.set(EMPTY_WORKSPACE_CATCH_UP);
  }

  private updateCreatedMessageState(roomId: number, createdMessage: Message): void {
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
    this.catchUpRequestVersion.update((version) => version + 1);
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

  public acceptInvite(token: string): Observable<AuthSubmissionResult> {
    this.acceptInvitePendingState.set(true);

    return this.workspaceApiService.acceptInvite(token).pipe(
      tap((workspaceAccess) => {
        const existingWorkspaces = this.workspaces();
        const nextWorkspaces = [
          workspaceAccess,
          ...existingWorkspaces.filter(
            (existingWorkspace) => existingWorkspace.workspace.id !== workspaceAccess.workspace.id,
          ),
        ];

        this.workspaceCollectionResource.set(nextWorkspaces);
        this.resetWorkspaceContextState();
        this.refreshWorkspaceContextData();
      }),
      map((workspaceAccess) => ({
        level: TOAST_LEVEL.success,
        message: `You now have access to ${workspaceAccess.workspace.name}.`,
        title: 'Invite accepted',
      })),
      finalize(() => {
        this.acceptInvitePendingState.set(false);
      }),
    );
  }

  public clearSelectedRoom(): void {
    this.clearSelectedThread();
    this.selectedRoomIdState.set(null);
  }

  public clearSelectedThread(): void {
    this.selectedThreadMessageIdState.set(null);
  }

  public createInvite(
    workspaceId: number,
    invite: CreateInvite,
  ): Observable<{ readonly invite: Invite; readonly result: AuthSubmissionResult }> {
    this.createInvitePendingState.set(true);

    return this.workspaceApiService.createInvite(workspaceId, invite).pipe(
      tap((createdInvite) => {
        this.inviteCollectionResource.set([createdInvite, ...this.invites()]);
        this.refreshInvites();
      }),
      map((createdInvite) => ({
        invite: createdInvite,
        result: {
          level: TOAST_LEVEL.success,
          message: 'A shareable workspace invite is ready to send.',
          title: 'Invite created',
        },
      })),
      finalize(() => {
        this.createInvitePendingState.set(false);
      }),
    );
  }

  public createMessage(roomId: number, message: CreateMessage): Observable<AuthSubmissionResult> {
    this.createMessagePendingState.set(true);

    return this.workspaceApiService.createMessage(roomId, message).pipe(
      tap((createdMessage) => {
        this.updateCreatedMessageState(roomId, createdMessage);
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
        this.catchUpRequestVersion.update((version) => version + 1);
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
        this.resetWorkspaceContextState();
        this.catchUpRequestVersion.update((version) => version + 1);
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
        const nextLastReadMessageId = readState.lastReadMessageId ?? 0;
        const remainingUnreadMessages =
          this.selectedRoom()?.id === roomId
            ? this.messages().filter((message) => message.id > nextLastReadMessageId).length
            : null;

        this.updateWorkspaceActivityRoom(roomId, (roomActivity) => ({
          ...roomActivity,
          readState,
          unreadMessageCount:
            remainingUnreadMessages ??
            (roomActivity.lastMessage?.id
              ? roomActivity.lastMessage.id > (readState.lastReadMessageId ?? 0)
                ? roomActivity.unreadMessageCount
                : 0
              : 0),
        }));
        this.catchUpRequestVersion.update((version) => version + 1);
      }),
      map(() => void 0),
    );
  }

  public refreshCatchUp(): void {
    this.catchUpRequestVersion.update((version) => version + 1);
  }

  public refreshInvitePreview(): void {
    this.invitePreviewRequestVersion.update((version) => version + 1);
  }

  public refreshInvites(): void {
    this.inviteRequestVersion.update((version) => version + 1);
  }

  public refreshMembers(): void {
    this.memberRequestVersion.update((version) => version + 1);
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

  public removeWorkspaceMember(
    workspaceId: number,
    memberId: number,
  ): Observable<AuthSubmissionResult> {
    this.removeMemberPendingState.set(memberId);

    return this.workspaceApiService.removeWorkspaceMember(workspaceId, memberId).pipe(
      tap(() => {
        const nextMembers = this.members().filter((member) => member.id !== memberId);

        this.memberCollectionResource.set(nextMembers);
        this.refreshMembers();
      }),
      map(() => ({
        level: TOAST_LEVEL.success,
        message: 'The member no longer has access to this workspace.',
        title: 'Member removed',
      })),
      finalize(() => {
        this.removeMemberPendingState.set(null);
      }),
    );
  }

  public removingMemberId(): null | number {
    return this.removeMemberPendingState();
  }

  public revokeInvite(workspaceId: number, inviteId: number): Observable<AuthSubmissionResult> {
    this.revokeInvitePendingState.set(inviteId);

    return this.workspaceApiService.revokeInvite(workspaceId, inviteId).pipe(
      tap(() => {
        const nextInvites = this.invites().filter((invite) => invite.id !== inviteId);

        this.inviteCollectionResource.set(nextInvites);
        this.refreshInvites();
      }),
      map(() => ({
        level: TOAST_LEVEL.success,
        message: 'The invite link is no longer valid.',
        title: 'Invite revoked',
      })),
      finalize(() => {
        this.revokeInvitePendingState.set(null);
      }),
    );
  }

  public revokingInviteId(): null | number {
    return this.revokeInvitePendingState();
  }

  public selectRoom(roomId: number): void {
    if (!Number.isInteger(roomId) || roomId <= 0) {
      this.clearSelectedRoom();
      return;
    }

    this.clearSelectedThread();
    this.selectedRoomIdState.set(roomId);
  }

  public selectThread(messageId: number): void {
    if (!Number.isInteger(messageId) || messageId <= 0) {
      this.clearSelectedThread();
      return;
    }

    this.selectedThreadMessageIdState.set(messageId);
  }

  public setInvitePreviewToken(token: null | string): void {
    this.inviteTokenState.set(token);
  }
}
