import Elysia from 'elysia';

import { prisma } from '@api/db/prisma';
import { DomainError } from '@api/errors/domain-error';
import { messageSelect, serializeMessage } from '@api/modules/messages/public-message';
import {
  serializeWorkspaceCatchUpItem,
  serializeReadState,
  serializeWorkspaceRoomActivity,
} from '@api/modules/read-states/public-read-state';
import { roomSelect } from '@api/modules/rooms/public-room';

import type { UpdateRoomReadStateRequestBody } from '@flaptalk/api-contract';

export class ReadStatesService {
  private async getFirstUnreadMessage(params: {
    readonly lastReadMessageId: null | number;
    readonly roomId: number;
  }) {
    return prisma.message.findFirst({
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      select: messageSelect,
      where: params.lastReadMessageId
        ? {
            id: {
              gt: params.lastReadMessageId,
            },
            roomId: params.roomId,
          }
        : {
            roomId: params.roomId,
          },
    });
  }

  private async getWorkspaceMembership(params: {
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    return prisma.workspace.findUnique({
      select: {
        id: true,
        members: {
          select: {
            role: true,
          },
          where: {
            userId: params.userId,
          },
        },
        rooms: {
          orderBy: [
            {
              createdAt: 'asc',
            },
            {
              id: 'asc',
            },
          ],
          select: roomSelect,
        },
      },
      where: {
        id: params.workspaceId,
      },
    });
  }

  private async getAccessibleRoom(params: { readonly roomId: number; readonly userId: number }) {
    return prisma.room.findUnique({
      select: {
        id: true,
        workspace: {
          select: {
            members: {
              select: {
                role: true,
              },
              where: {
                userId: params.userId,
              },
            },
          },
        },
      },
      where: {
        id: params.roomId,
      },
    });
  }

  private async buildWorkspaceRoomActivities(params: {
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    const workspaceMembership = await this.getWorkspaceMembership(params);

    if (!workspaceMembership || workspaceMembership.members.length === 0) {
      throw new DomainError(404, 'workspace_not_found', 'Workspace not found.');
    }

    const roomIds = workspaceMembership.rooms.map((room) => room.id);
    const [readStates, lastMessages] = await Promise.all([
      prisma.roomReadState.findMany({
        where: {
          roomId: {
            in: roomIds,
          },
          userId: params.userId,
        },
      }),
      prisma.room.findMany({
        select: {
          id: true,
          messages: {
            orderBy: [
              {
                createdAt: 'desc',
              },
              {
                id: 'desc',
              },
            ],
            select: messageSelect,
            take: 1,
          },
        },
        where: {
          id: {
            in: roomIds,
          },
        },
      }),
    ]);

    const readStateByRoomId = new Map(readStates.map((readState) => [readState.roomId, readState]));
    const lastMessageByRoomId = new Map(
      lastMessages.map((room) => [room.id, room.messages[0] ?? null]),
    );

    return Promise.all(
      workspaceMembership.rooms.map(async (room) => {
        const readState = readStateByRoomId.get(room.id) ?? null;
        const unreadMessageWhere = readState?.lastReadMessageId
          ? {
              id: {
                gt: readState.lastReadMessageId,
              },
              roomId: room.id,
            }
          : {
              roomId: room.id,
            };
        const unreadMessageCount = await prisma.message.count({
          where: unreadMessageWhere,
        });

        return serializeWorkspaceRoomActivity({
          lastMessage: lastMessageByRoomId.get(room.id) ?? null,
          readState,
          room,
          unreadMessageCount,
        });
      }),
    );
  }

  private sortWorkspaceRoomActivities(
    leftRoomActivity: ReturnType<typeof serializeWorkspaceRoomActivity>,
    rightRoomActivity: ReturnType<typeof serializeWorkspaceRoomActivity>,
  ): number {
    const unreadDelta =
      Number(rightRoomActivity.unreadMessageCount > 0) -
      Number(leftRoomActivity.unreadMessageCount > 0);

    if (unreadDelta !== 0) {
      return unreadDelta;
    }

    const rightTimestamp = Date.parse(
      rightRoomActivity.lastMessage?.createdAt ?? new Date(0).toISOString(),
    );
    const leftTimestamp = Date.parse(
      leftRoomActivity.lastMessage?.createdAt ?? new Date(0).toISOString(),
    );

    return rightTimestamp - leftTimestamp;
  }

  private sortWorkspaceCatchUpItems(
    leftItem: ReturnType<typeof serializeWorkspaceCatchUpItem>,
    rightItem: ReturnType<typeof serializeWorkspaceCatchUpItem>,
  ): number {
    const unreadDelta =
      Number(rightItem.unreadMessageCount > 0) - Number(leftItem.unreadMessageCount > 0);

    if (unreadDelta !== 0) {
      return unreadDelta;
    }

    const threadDelta =
      Number(rightItem.contextType === 'thread_reply') -
      Number(leftItem.contextType === 'thread_reply');

    if (threadDelta !== 0) {
      return threadDelta;
    }

    const rightTimestamp = Date.parse(rightItem.lastActivityAt ?? new Date(0).toISOString());
    const leftTimestamp = Date.parse(leftItem.lastActivityAt ?? new Date(0).toISOString());

    return rightTimestamp - leftTimestamp;
  }

  public async getWorkspaceActivity(params: {
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    const rooms = await this.buildWorkspaceRoomActivities(params);

    return {
      rooms,
      unreadMessageCount: rooms.reduce(
        (count, roomActivity) => count + roomActivity.unreadMessageCount,
        0,
      ),
      unreadRoomCount: rooms.filter((roomActivity) => roomActivity.unreadMessageCount > 0).length,
    };
  }

  public async getWorkspaceCatchUp(params: {
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    const roomActivities = await this.buildWorkspaceRoomActivities(params);
    const firstUnreadMessages = await Promise.all(
      roomActivities.map(async (roomActivity) => {
        if (roomActivity.unreadMessageCount === 0) {
          return [roomActivity.room.id, null] as const;
        }

        const firstUnreadMessage = await this.getFirstUnreadMessage({
          lastReadMessageId: roomActivity.readState?.lastReadMessageId ?? null,
          roomId: roomActivity.room.id,
        });

        return [
          roomActivity.room.id,
          firstUnreadMessage ? serializeMessage(firstUnreadMessage) : null,
        ] as const;
      }),
    );
    const firstUnreadMessageByRoomId = new Map(firstUnreadMessages);
    const threadRootMessageIds = [
      ...new Set(
        roomActivities
          .map((roomActivity) => {
            const firstUnreadMessage = firstUnreadMessageByRoomId.get(roomActivity.room.id) ?? null;
            const resumeTargetMessage = firstUnreadMessage ?? roomActivity.lastMessage;

            return resumeTargetMessage?.parentMessageId ?? null;
          })
          .filter((messageId): messageId is number => messageId !== null),
      ),
    ];
    const threadRootMessages = await prisma.message.findMany({
      select: messageSelect,
      where: {
        id: {
          in: threadRootMessageIds,
        },
      },
    });
    const threadRootMessageById = new Map(
      threadRootMessages.map((message) => [message.id, message]),
    );
    const items = [...roomActivities]
      .sort((leftRoomActivity, rightRoomActivity) =>
        this.sortWorkspaceRoomActivities(leftRoomActivity, rightRoomActivity),
      )
      .map((roomActivity) => {
        const firstUnreadMessage = firstUnreadMessageByRoomId.get(roomActivity.room.id) ?? null;
        const resumeTargetMessage = firstUnreadMessage ?? roomActivity.lastMessage;
        const threadRootMessageId = resumeTargetMessage?.parentMessageId ?? null;
        const threadRootMessage =
          threadRootMessageId === null
            ? resumeTargetMessage
            : (() => {
                const rootMessage = threadRootMessageById.get(threadRootMessageId);

                return rootMessage ? serializeMessage(rootMessage) : null;
              })();

        return serializeWorkspaceCatchUpItem({
          contextType: threadRootMessageId === null ? 'room_message' : 'thread_reply',
          firstUnreadMessage,
          lastActivityAt: roomActivity.lastMessage
            ? new Date(roomActivity.lastMessage.createdAt)
            : null,
          lastAuthor: roomActivity.lastMessage?.author ?? null,
          lastMessage: roomActivity.lastMessage ?? null,
          preview:
            (threadRootMessageId !== null ? threadRootMessage?.body : resumeTargetMessage?.body) ??
            'This room is configured and ready for the next wave of activity.',
          resumeMode: firstUnreadMessage ? 'unread' : 'latest',
          resumeTargetMessageId: resumeTargetMessage?.id ?? null,
          room: roomActivity.room,
          threadRootMessage: threadRootMessage ?? null,
          threadRootMessageId,
          unreadMessageCount: roomActivity.unreadMessageCount,
        });
      });
    const sortedItems = [...items].sort((leftItem, rightItem) =>
      this.sortWorkspaceCatchUpItems(leftItem, rightItem),
    );

    return {
      items: sortedItems,
      primaryItem: sortedItems[0] ?? null,
    };
  }

  public async updateRoomReadState(params: {
    readonly message: UpdateRoomReadStateRequestBody;
    readonly roomId: number;
    readonly userId: number;
  }) {
    const accessibleRoom = await this.getAccessibleRoom(params);

    if (!accessibleRoom || accessibleRoom.workspace.members.length === 0) {
      throw new DomainError(404, 'room_not_found', 'Room not found.');
    }

    const lastReadMessage = await prisma.message.findUnique({
      select: {
        id: true,
        roomId: true,
      },
      where: {
        id: params.message.lastReadMessageId,
      },
    });

    if (!lastReadMessage || lastReadMessage.roomId !== params.roomId) {
      throw new DomainError(
        404,
        'message_not_found',
        'The read marker message was not found in this room.',
      );
    }

    const readState = await prisma.roomReadState.upsert({
      create: {
        lastReadMessageId: lastReadMessage.id,
        roomId: params.roomId,
        userId: params.userId,
      },
      select: {
        lastReadMessageId: true,
        roomId: true,
        updatedAt: true,
        userId: true,
      },
      update: {
        lastReadMessageId: lastReadMessage.id,
      },
      where: {
        roomId_userId: {
          roomId: params.roomId,
          userId: params.userId,
        },
      },
    });

    return serializeReadState(readState);
  }
}

export type ReadStatesServiceType = ReadStatesService;

export const readStatesService = new Elysia({
  name: 'flaptalk.readStates.service',
}).decorate('readStatesService', new ReadStatesService());
