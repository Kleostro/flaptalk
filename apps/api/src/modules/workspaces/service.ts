import Elysia from 'elysia';

import { prisma } from '@api/db/prisma';
import { DomainError } from '@api/errors/domain-error';
import {
  serializeWorkspaceMember,
  workspaceMemberSelect,
} from '@api/modules/invites/public-invite';
import {
  serializeWorkspaceAccess,
  workspaceAccessSelect,
  workspaceSelect,
} from '@api/modules/workspaces/public-workspace';

import type { CreateWorkspaceRequestBody } from '@flaptalk/api-contract';

function normalizeWorkspaceDescription(description: null | string | undefined): null | string {
  const normalizedDescription = description?.trim();

  return normalizedDescription ? normalizedDescription : null;
}

function normalizeWorkspaceName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function createWorkspaceSlugBase(name: string): string {
  const slugBase = normalizeWorkspaceName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slugBase || 'workspace';
}

export class WorkspacesService {
  private async resolveAvailableWorkspaceSlug(name: string): Promise<string> {
    const slugBase = createWorkspaceSlugBase(name);
    const existingWorkspaces = await prisma.workspace.findMany({
      select: {
        slug: true,
      },
      where: {
        slug: {
          startsWith: slugBase,
        },
      },
    });

    const takenSlugs = new Set(existingWorkspaces.map(({ slug }) => slug));

    if (!takenSlugs.has(slugBase)) {
      return slugBase;
    }

    let nextSuffix = 2;

    while (takenSlugs.has(`${slugBase}-${nextSuffix}`)) {
      nextSuffix += 1;
    }

    return `${slugBase}-${nextSuffix}`;
  }

  public async createWorkspace(params: {
    readonly ownerId: number;
    readonly workspace: CreateWorkspaceRequestBody;
  }) {
    const normalizedName = normalizeWorkspaceName(params.workspace.name);
    const workspaceSlug = await this.resolveAvailableWorkspaceSlug(normalizedName);
    const createdWorkspaceAccess = await prisma.$transaction(async (transaction) => {
      const createdWorkspace = await transaction.workspace.create({
        data: {
          description: normalizeWorkspaceDescription(params.workspace.description),
          name: normalizedName,
          ownerId: params.ownerId,
          slug: workspaceSlug,
        },
        select: workspaceSelect,
      });

      return transaction.workspaceMember.create({
        data: {
          role: 'OWNER',
          userId: params.ownerId,
          workspaceId: createdWorkspace.id,
        },
        select: workspaceAccessSelect,
      });
    });

    return serializeWorkspaceAccess(createdWorkspaceAccess);
  }

  public async getWorkspaceForMember(params: {
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    const workspaceAccess = await prisma.workspaceMember.findUnique({
      select: workspaceAccessSelect,
      where: {
        workspaceId_userId: {
          userId: params.userId,
          workspaceId: params.workspaceId,
        },
      },
    });

    if (!workspaceAccess) {
      throw new DomainError(404, 'workspace_not_found', 'Workspace not found.');
    }

    return serializeWorkspaceAccess(workspaceAccess);
  }

  public async listWorkspacesForMember(userId: number) {
    const workspaceAccessList = await prisma.workspaceMember.findMany({
      orderBy: [
        {
          joinedAt: 'asc',
        },
        {
          workspace: {
            updatedAt: 'desc',
          },
        },
      ],
      select: workspaceAccessSelect,
      where: {
        userId,
      },
    });

    return {
      workspaces: workspaceAccessList.map((workspaceAccess) =>
        serializeWorkspaceAccess(workspaceAccess),
      ),
    };
  }

  public async listWorkspaceMembers(params: {
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    const workspaceAccess = await prisma.workspaceMember.findUnique({
      select: {
        workspaceId: true,
      },
      where: {
        workspaceId_userId: {
          userId: params.userId,
          workspaceId: params.workspaceId,
        },
      },
    });

    if (!workspaceAccess) {
      throw new DomainError(404, 'workspace_not_found', 'Workspace not found.');
    }

    const members = await prisma.workspaceMember.findMany({
      orderBy: [
        {
          role: 'asc',
        },
        {
          joinedAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      select: workspaceMemberSelect,
      where: {
        workspaceId: params.workspaceId,
      },
    });

    return {
      members: members.map((member) => serializeWorkspaceMember(member)),
    };
  }

  public async removeWorkspaceMember(params: {
    readonly memberId: number;
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    const workspaceAccess = await prisma.workspaceMember.findUnique({
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

    if (!workspaceAccess) {
      throw new DomainError(404, 'workspace_not_found', 'Workspace not found.');
    }

    if (workspaceAccess.role !== 'OWNER') {
      throw new DomainError(
        403,
        'workspace_member_forbidden',
        'Only workspace owners can remove members.',
      );
    }

    const member = await prisma.workspaceMember.findUnique({
      select: {
        id: true,
        role: true,
        userId: true,
        workspaceId: true,
      },
      where: {
        id: params.memberId,
      },
    });

    if (!member || member.workspaceId !== params.workspaceId) {
      throw new DomainError(404, 'workspace_member_not_found', 'Workspace member not found.');
    }

    if (member.role === 'OWNER') {
      throw new DomainError(
        409,
        'workspace_member_owner_protected',
        'Workspace owners cannot be removed through this action.',
      );
    }

    if (member.userId === params.userId) {
      throw new DomainError(
        409,
        'workspace_member_self_removal_forbidden',
        'Use a dedicated leave flow instead of removing yourself as a member.',
      );
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.roomReadState.deleteMany({
        where: {
          room: {
            workspaceId: params.workspaceId,
          },
          userId: member.userId,
        },
      });

      await transaction.workspaceMember.delete({
        where: {
          id: member.id,
        },
      });
    });

    return {
      success: true as const,
    };
  }
}

export type WorkspacesServiceType = WorkspacesService;

export const workspacesService = new Elysia({
  name: 'flaptalk.workspaces.service',
}).decorate('workspacesService', new WorkspacesService());
