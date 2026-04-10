export interface WorkspaceCatchUpItem {
  readonly contextLabel: string;
  readonly lastActivityAt: null | string;
  readonly lastAuthorEmail: null | string;
  readonly preview: string;
  readonly resumeLabel: string;
  readonly resumeMode: 'latest' | 'unread';
  readonly roomId: number;
  readonly roomName: string;
  readonly threadRootMessageId: null | number;
  readonly unreadLabel: string;
  readonly unreadMessageCount: number;
}
