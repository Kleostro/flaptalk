export const WORKSPACE_PAGE_ACTIVITY_CARDS = [
  {
    body: [
      'Unread activity, important summaries, and room context will collect here',
      'as the shell fills with real rooms.',
    ].join(' '),
    title: 'Catch up',
  },
  {
    body: [
      'Active discussion surfaces will start from the rooms you create',
      'and grow into thread-aware catch-up views.',
    ].join(' '),
    title: 'Active threads',
  },
  {
    body: [
      'Rooms now attach to the workspace directly, and owners can shape the shell',
      'one space at a time.',
    ].join(' '),
    title: 'Rooms',
  },
] as const;

export const WORKSPACE_PAGE_OVERVIEW_CARDS = [
  {
    description:
      'The shell is connected to live workspace persistence and membership-aware access.',
    label: 'Workspace state',
    pendingDescription:
      'Create the first workspace to unlock rooms, member access, and future thread flow.',
    value: 'Active',
  },
  {
    description:
      'The UI is now moving toward a shell-first product layout instead of a cinematic entry page.',
    label: 'Current phase',
    pendingDescription:
      'This surface will turn into the operator home for rooms, summaries, and community context.',
    value: 'Foundation',
  },
] as const;

export const WORKSPACE_PAGE_ROOM_SETUP_HINTS = [
  'General updates and announcements',
  'Question-driven structured discussions',
  'References, notes, and later summaries',
] as const;
