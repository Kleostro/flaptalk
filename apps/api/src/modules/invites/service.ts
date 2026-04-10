import Elysia from 'elysia';

import { prisma } from '@api/db/prisma';
import { DomainError } from '@api/errors/domain-error';
import {
  invitePreviewSelect,
  inviteSelect,
  serializeInvite,
  serializeInvitePreview,
} from '@api/modules/invites/public-invite';
import { assertWorkspaceOwner } from '@api/modules/workspaces/access';
import {
  serializeWorkspaceAccess,
  workspaceAccessSelect,
} from '@api/modules/workspaces/public-workspace';

import type { CreateInviteRequestBody } from '@flaptalk/api-contract';

function normalizeInviteEmail(email: null | string | undefined): null | string {
  const normalizedEmail = email?.trim().toLowerCase();

  return normalizedEmail ? normalizedEmail : null;
}

function resolveInviteExpiry(expiresInHours: null | number | undefined): Date {
  const expiresInMs = (expiresInHours ?? 72) * 60 * 60 * 1000;

  return new Date(Date.now() + expiresInMs);
}

function createInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export class InvitesService {
  public async createInvite(params: {
    readonly invite: CreateInviteRequestBody;
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    await assertWorkspaceOwner({
      errorCode: 'invite_forbidden',
      errorMessage: 'Only workspace owners can create invites.',
      userId: params.userId,
      workspaceId: params.workspaceId,
    });

    const createdInvite = await prisma.invite.create({
      data: {
        createdById: params.userId,
        email: normalizeInviteEmail(params.invite.email),
        expiresAt: resolveInviteExpiry(params.invite.expiresInHours),
        token: createInviteToken(),
        workspaceId: params.workspaceId,
      },
      select: inviteSelect,
    });

    return serializeInvite(createdInvite);
  }

  public async listWorkspaceInvites(params: {
    readonly userId: number;
    readonly workspaceId: number;
  }) {
    await assertWorkspaceOwner({
      errorCode: 'invite_forbidden',
      errorMessage: 'Only workspace owners can view invites.',
      userId: params.userId,
      workspaceId: params.workspaceId,
    });

    const invites = await prisma.invite.findMany({
      orderBy: [
        {
          usedAt: 'asc',
        },
        {
          expiresAt: 'asc',
        },
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      select: inviteSelect,
      where: {
        workspaceId: params.workspaceId,
      },
    });

    return {
      invites: invites.map((invite) => serializeInvite(invite)),
    };
  }

  public async getInvitePreview(token: string) {
    const invite = await prisma.invite.findUnique({
      select: invitePreviewSelect,
      where: {
        token,
      },
    });

    if (!invite) {
      throw new DomainError(404, 'invite_not_found', 'Invite not found.');
    }

    return serializeInvitePreview(invite);
  }

  public async acceptInvite(params: { readonly token: string; readonly userId: number }) {
    const [invite, user] = await Promise.all([
      prisma.invite.findUnique({
        select: {
          email: true,
          expiresAt: true,
          id: true,
          usedAt: true,
          workspaceId: true,
        },
        where: {
          token: params.token,
        },
      }),
      prisma.user.findUnique({
        select: {
          email: true,
        },
        where: {
          id: params.userId,
        },
      }),
    ]);

    if (!user) {
      throw new DomainError(401, 'auth_unauthorized', 'Authentication is required.');
    }

    if (!invite) {
      throw new DomainError(404, 'invite_not_found', 'Invite not found.');
    }

    if (invite.email && invite.email !== user.email.toLowerCase()) {
      throw new DomainError(
        403,
        'invite_forbidden',
        'This invite was issued for a different email address.',
      );
    }

    if (invite.usedAt) {
      throw new DomainError(409, 'invite_already_used', 'Invite has already been used.');
    }

    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new DomainError(409, 'invite_expired', 'Invite has expired.');
    }

    const [, workspaceAccess] = await prisma.$transaction(async (transaction) => {
      const existingMembership = await transaction.workspaceMember.findUnique({
        select: {
          role: true,
        },
        where: {
          workspaceId_userId: {
            userId: params.userId,
            workspaceId: invite.workspaceId,
          },
        },
      });

      if (!existingMembership) {
        await transaction.workspaceMember.create({
          data: {
            role: 'MEMBER',
            userId: params.userId,
            workspaceId: invite.workspaceId,
          },
        });
      }

      await transaction.invite.update({
        data: {
          usedAt: new Date(),
        },
        where: {
          id: invite.id,
        },
      });

      const createdWorkspaceAccess = await transaction.workspaceMember.findUnique({
        select: workspaceAccessSelect,
        where: {
          workspaceId_userId: {
            userId: params.userId,
            workspaceId: invite.workspaceId,
          },
        },
      });

      if (!createdWorkspaceAccess) {
        throw new DomainError(404, 'workspace_not_found', 'Workspace not found.');
      }

      return [existingMembership, createdWorkspaceAccess] as const;
    });

    return serializeWorkspaceAccess(workspaceAccess);
  }
}

export type InvitesServiceType = InvitesService;

export const invitesService = new Elysia({
  name: 'flaptalk.invites.service',
}).decorate('invitesService', new InvitesService());
