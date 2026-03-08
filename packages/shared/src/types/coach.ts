export interface Coach {
  id: string;
  userId: string;
  name: string;
  photoUrl?: string | null;
  phone?: string | null;
  teamId?: string | null;
  team?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}
