export interface Team {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  _count?: {
    coaches: number;
    players: number;
  };
}

export interface TeamWithRelations extends Team {
  coaches: {
    id: string;
    name: string;
    photoUrl?: string | null;
  }[];
  players: {
    id: string;
    name: string;
    photoUrl?: string | null;
    position?: string | null;
  }[];
}
