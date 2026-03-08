export interface CoachNote {
  id: string;
  content: string;
  playerId: string;
  coachId: string;
  coach?: {
    name: string;
  };
  createdAt: string;
}
