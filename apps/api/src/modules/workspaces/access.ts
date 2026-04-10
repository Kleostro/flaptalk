import { prisma } from '@api/db/prisma';
import { DomainError } from '@api/errors/domain-error';

export async function findWorkspaceMemberRole(params: {
  readonly userId: number;
  readonly workspaceId: number;
}): Promise<null | 'MEMBER' | 'OWNER'> {
  const membership = await prisma.workspaceMember.findUnique({
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

  return membership?.role ?? null;
}

export async function assertWorkspaceMember(params: {
  readonly userId: number;
  readonly workspaceId: number;
}): Promise<'MEMBER' | 'OWNER'> {
  const role = await findWorkspaceMemberRole(params);

  if (!role) {
    throw new DomainError(404, 'workspace_not_found', 'Workspace not found.');
  }

  return role;
}

export async function assertWorkspaceOwner(params: {
  readonly userId: number;
  readonly workspaceId: number;
  readonly errorCode: string;
  readonly errorMessage: string;
}): Promise<void> {
  const role = await assertWorkspaceMember(params);

  if (role !== 'OWNER') {
    throw new DomainError(403, params.errorCode, params.errorMessage);
  }
}
