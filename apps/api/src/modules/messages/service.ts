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

  private async getAccessibleMessage(params: {
    readonly messageId: number;
    readonly userId: number;
  }) {
    return prisma.message.findUnique({
      select: {
        id: true,
        parentMessageId: true,
        roomId: true,
        room: {
          select: {
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
        },
      },
      where: {
        id: params.messageId,
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

    let parentMessageId: null | number = null;

    if (params.message.parentMessageId !== null && params.message.parentMessageId !== undefined) {
      const parentMessage = await prisma.message.findUnique({
        select: {
          id: true,
          parentMessageId: true,
          roomId: true,
        },
        where: {
          id: params.message.parentMessageId,
        },
      });

      if (!parentMessage || parentMessage.roomId !== params.roomId) {
        throw new DomainError(404, 'message_not_found', 'Parent message not found.');
      }

      parentMessageId = parentMessage.parentMessageId ?? parentMessage.id;
    }

    const createdMessage = await prisma.message.create({
      data: {
        authorId: params.userId,
        body: normalizeMessageBody(params.message.body),
        parentMessageId,
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
        parentMessageId: null,
        roomId: params.roomId,
      },
    });

    return {
      messages: messages.map((message) => serializeMessage(message)),
    };
  }

  public async getThreadForMessageMember(params: {
    readonly messageId: number;
    readonly userId: number;
  }) {
    const accessibleMessage = await this.getAccessibleMessage(params);

    if (!accessibleMessage || accessibleMessage.room.workspace.members.length === 0) {
      throw new DomainError(404, 'message_not_found', 'Message not found.');
    }

    const rootMessageId = accessibleMessage.parentMessageId ?? accessibleMessage.id;
    const rootMessage = await prisma.message.findUnique({
      select: messageSelect,
      where: {
        id: rootMessageId,
      },
    });

    if (!rootMessage) {
      throw new DomainError(404, 'message_not_found', 'Message not found.');
    }

    const replies = await prisma.message.findMany({
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
        parentMessageId: rootMessage.id,
      },
    });

    return {
      replies: replies.map((message) => serializeMessage(message)),
      rootMessage: serializeMessage(rootMessage),
    };
  }
}

export type MessagesServiceType = MessagesService;

export const messagesService = new Elysia({
  name: 'flaptalk.messages.service',
}).decorate('messagesService', new MessagesService());
