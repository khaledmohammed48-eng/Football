export const ATTRIBUTE_KEYS = [
  'speed',
  'passing',
  'shooting',
  'dribbling',
  'defense',
  'stamina',
  'heading',
  'leftFoot',
  'rightFoot',
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
  heading: number;
  overall: number;
  leftFoot: number;
  rightFoot: number;
  updatedAt: string;
}
