export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'COACH' | 'PLAYER';

export interface BaseUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AccountListItem {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  profile: {
    name: string;
    teamName?: string;
  } | null;
}
