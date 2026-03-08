export const ATTRIBUTE_KEYS = [
  'speed',
  'passing',
  'shooting',
  'dribbling',
  'defense',
  'stamina',
] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export interface PlayerAttributes {
  id: string;
  playerId: string;
  speed: number;
  passing: number;
  shooting: number;
  dribbling: number;
  defense: number;
  stamina: number;
  updatedAt: string;
}
