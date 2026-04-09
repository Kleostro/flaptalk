import Elysia from 'elysia';

import { prisma } from '@api/db/prisma';
import { DomainError } from '@api/errors/domain-error';
import { messageSelect, serializeMessage } from '@api/modules/messages/public-message';

import type { CreateMessageRequestBody } from '@flaptalk/api-contract';

function normalizeMessageBody(body: string): string {
  return body.trim().replace(/\s+/g, ' ');
}

export class MessagesService {
  private async getRoomMembership(params: { readonly roomId: number; readonly userId: number }) {
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

  public async createMessage(params: {
    readonly message: CreateMessageRequestBody;
    readonly roomId: number;
    readonly userId: number;
  }) {
    const roomMembership = await this.getRoomMembership(params);

    if (!roomMembership || roomMembership.workspace.members.length === 0) {
      throw new DomainError(404, 'room_not_found', 'Room not found.');
    }

    const createdMessage = await prisma.message.create({
      data: {
        authorId: params.userId,
        body: normalizeMessageBody(params.message.body),
        roomId: params.roomId,
      },
      select: messageSelect,
    });

    return serializeMessage(createdMessage);
  }

  public async listMessagesForRoomMember(params: {
    readonly roomId: number;
    readonly userId: number;
  }) {
    const roomMembership = await this.getRoomMembership(params);

    if (!roomMembership || roomMembership.workspace.members.length === 0) {
      throw new DomainError(404, 'room_not_found', 'Room not found.');
    }

    const messages = await prisma.message.findMany({
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      select: messageSelect,
      where: {
        roomId: params.roomId,
      },
    });

    return {
      messages: messages.map((message) => serializeMessage(message)),
    };
  }
}

export type MessagesServiceType = MessagesService;

export const messagesService = new Elysia({
  name: 'flaptalk.messages.service',
}).decorate('messagesService', new MessagesService());
