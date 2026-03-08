import type { Role } from '../types/user';
import type { Position } from '../types/player';

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'مدير عام',
  ADMIN: 'مدير',
  COACH: 'مدرب',
  PLAYER: 'لاعب',
};

export const POSITION_LABELS: Record<Position, string> = {
  GOALKEEPER: 'حارس مرمى',
  DEFENDER: 'مدافع',
  MIDFIELDER: 'وسط',
  FORWARD: 'مهاجم',
};

export const POSITION_VALUES: Position[] = [
  'GOALKEEPER',
  'DEFENDER',
  'MIDFIELDER',
  'FORWARD',
];
