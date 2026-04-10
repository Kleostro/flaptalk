export const LINK_APPEARANCE = {
  inline: 'inline',
  subtle: 'subtle',
} as const;

export type LinkAppearance = (typeof LINK_APPEARANCE)[keyof typeof LINK_APPEARANCE];
