import type { PlayerAttributes } from './attributes';
import type { CoachNote } from './note';

export type Position = 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';

export interface Player {
  id: string;
  userId: string;
  name: string;
  photoUrl?: string | null;
  dateOfBirth?: string | null;
  position?: Position | null;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  teamId?: string | null;
  team?: {
    id: string;
    name: string;
  } | null;
  attributes?: PlayerAttributes | null;
  notes?: CoachNote[];
  createdAt: string;
}
