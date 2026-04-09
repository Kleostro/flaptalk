import Elysia from 'elysia';

import { prisma } from '@api/db/prisma';
import { DomainError } from '@api/errors/domain-error';
import { messageSelect } from '@api/modules/messages/public-message';
import {
  serializeReadState,
  serializeWorkspaceRoomActivity,
} from '@api/modules/read-states/public-read-state';
import { roomSelect } from '@api/modules/rooms/public-room';

import type { UpdateRoomReadStateRequestBody } from '@flaptalk/api-contract';

export class ReadStatesService {
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

  public async getWorkspaceActivity(params: {
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

    const rooms = await Promise.all(
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

    return {
      rooms,
      unreadMessageCount: rooms.reduce(
        (count, roomActivity) => count + roomActivity.unreadMessageCount,
        0,
      ),
      unreadRoomCount: rooms.filter((roomActivity) => roomActivity.unreadMessageCount > 0).length,
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
