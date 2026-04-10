import { type WorkspaceMember } from '@flaptalk/api-contract';

export interface WorkspaceMemberRow extends WorkspaceMember {
  readonly isCurrentUser: boolean;
}
