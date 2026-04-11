import { serializeUser, publicUserSelect } from '@api/modules/users/public-user';
import { serializeWorkspace, workspaceSelect } from '@api/modules/workspaces/public-workspace';

const inviteSelect = {
  createdAt: true,
  createdById: true,
  email: true,
  expiresAt: true,
  id: true,
  token: true,
  usedAt: true,
  workspaceId: true,
} as const;

const workspaceMemberSelect = {
  id: true,
  joinedAt: true,
  role: true,
  user: {
    select: publicUserSelect,
  },
} as const;

const invitePreviewSelect = {
  createdAt: true,
  createdById: true,
  email: true,
  expiresAt: true,
  id: true,
  token: true,
  usedAt: true,
  workspace: {
    select: workspaceSelect,
  },
  workspaceId: true,
} as const;

type SerializableInvite = {
  readonly createdAt: Date;
  readonly createdById: number;
  readonly email: null | string;
  readonly expiresAt: Date;
  readonly id: number;
  readonly token: string;
  readonly usedAt: Date | null;
  readonly workspaceId: number;
};

type SerializableInvitePreview = SerializableInvite & {
  readonly workspace: {
    readonly createdAt: Date;
    readonly description: null | string;
    readonly id: number;
    readonly name: string;
    readonly ownerId: number;
    readonly slug: string;
    readonly updatedAt: Date;
  };
};

type SerializableWorkspaceMember = {
  readonly id: number;
  readonly joinedAt: Date;
  readonly role: 'MEMBER' | 'OWNER';
  readonly user: {
    readonly createdAt: Date;
    readonly email: string;
    readonly id: number;
    readonly updatedAt: Date;
  };
};

export function serializeInvite(invite: SerializableInvite) {
  return {
    ...invite,
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt.toISOString(),
    usedAt: invite.usedAt?.toISOString() ?? null,
  };
}

export function serializeInvitePreview(invite: SerializableInvitePreview) {
  return {
    expiresAt: invite.expiresAt.toISOString(),
    invite: serializeInvite(invite),
    isExpired: invite.expiresAt.getTime() <= Date.now(),
    isUsed: invite.usedAt !== null,
    workspace: serializeWorkspace(invite.workspace),
  };
}

export function serializeWorkspaceMember(member: SerializableWorkspaceMember) {
  return {
    id: member.id,
    joinedAt: member.joinedAt.toISOString(),
    role: member.role.toLowerCase() as 'member' | 'owner',
    user: serializeUser(member.user),
  };
}

export { invitePreviewSelect, inviteSelect, workspaceMemberSelect };
