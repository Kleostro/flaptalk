const workspaceSelect = {
  createdAt: true,
  description: true,
  id: true,
  name: true,
  ownerId: true,
  slug: true,
  updatedAt: true,
} as const;

const workspaceAccessSelect = {
  role: true,
  workspace: {
    select: workspaceSelect,
  },
} as const;

type SerializableWorkspace = {
  readonly createdAt: Date;
  readonly description: null | string;
  readonly id: number;
  readonly name: string;
  readonly ownerId: number;
  readonly slug: string;
  readonly updatedAt: Date;
};

type SerializableWorkspaceAccess = {
  readonly role: 'MEMBER' | 'OWNER';
  readonly workspace: SerializableWorkspace;
};

export function serializeWorkspace(workspace: SerializableWorkspace) {
  return {
    ...workspace,
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

export function serializeWorkspaceAccess(workspaceAccess: SerializableWorkspaceAccess) {
  return {
    role: workspaceAccess.role.toLowerCase() as 'member' | 'owner',
    workspace: serializeWorkspace(workspaceAccess.workspace),
  };
}

export { workspaceAccessSelect, workspaceSelect };
