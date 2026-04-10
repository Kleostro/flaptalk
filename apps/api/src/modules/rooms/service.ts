import Elysia from 'elysia';

import { prisma } from '@api/db/prisma';
import { DomainError } from '@api/errors/domain-error';
import { roomSelect, serializeRoom } from '@api/modules/rooms/public-room';

import type { CreateRoomRequestBody } from '@flaptalk/api-contract';

function normalizeRoomDescription(description: null | string | undefined): null | string {
  const normalizedDescription = description?.trim();

  return normalizedDescription ? normalizedDescription : null;
}

function normalizeRoomName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function createRoomSlugBase(name: string): string {
  const slugBase = normalizeRoomName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slugBase || 'room';
}

export class RoomsService {
  private async getWorkspaceMembership(params: {
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    return prisma.workspaceMember.findUnique({
      select: {
        role: true,
      },
      where: {
        workspaceId_userId: {
          userId: params.userId,
          workspaceId: params.workspaceId,
        },
      },
    });
  }

  private async resolveAvailableRoomSlug(params: {
    readonly name: string;
    readonly workspaceId: number;
  }): Promise<string> {
    const slugBase = createRoomSlugBase(params.name);
    const existingRooms = await prisma.room.findMany({
      select: {
        slug: true,
      },
      where: {
        slug: {
          startsWith: slugBase,
        },
        workspaceId: params.workspaceId,
      },
    });

    const takenSlugs = new Set(existingRooms.map(({ slug }) => slug));

    if (!takenSlugs.has(slugBase)) {
      return slugBase;
    }

    let nextSuffix = 2;

    while (takenSlugs.has(`${slugBase}-${nextSuffix}`)) {
      nextSuffix += 1;
    }

    return `${slugBase}-${nextSuffix}`;
  }

  public async createRoom(params: {
    readonly userId: number;
    readonly workspaceId: number;
    readonly room: CreateRoomRequestBody;
  }) {
    const workspaceMembership = await this.getWorkspaceMembership({
      userId: params.userId,
      workspaceId: params.workspaceId,
    });

    if (!workspaceMembership) {
      throw new DomainError(404, 'workspace_not_found', 'Workspace not found.');
    }

    if (workspaceMembership.role !== 'OWNER') {
      throw new DomainError(403, 'room_forbidden', 'Only workspace owners can create rooms.');
    }

    const normalizedName = normalizeRoomName(params.room.name);
    const roomSlug = await this.resolveAvailableRoomSlug({
      name: normalizedName,
      workspaceId: params.workspaceId,
    });

    const createdRoom = await prisma.room.create({
      data: {
        description: normalizeRoomDescription(params.room.description),
        name: normalizedName,
        slug: roomSlug,
        workspaceId: params.workspaceId,
      },
      select: roomSelect,
    });

    return serializeRoom(createdRoom);
  }

  public async listRoomsForWorkspaceMember(params: {
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    const workspaceMembership = await this.getWorkspaceMembership(params);

    if (!workspaceMembership) {
      throw new DomainError(404, 'workspace_not_found', 'Workspace not found.');
    }

    const rooms = await prisma.room.findMany({
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      select: roomSelect,
      where: {
        workspaceId: params.workspaceId,
      },
    });

    return {
      rooms: rooms.map((room) => serializeRoom(room)),
    };
  }
}

export type RoomsServiceType = RoomsService;

export const roomsService = new Elysia({
  name: 'flaptalk.rooms.service',
}).decorate('roomsService', new RoomsService());
