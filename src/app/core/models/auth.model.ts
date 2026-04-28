export type UserRole = 'ADMIN' | 'ACTOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  actorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/** Admin-only user management (matches API body). */
export interface AdminCreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  actorId?: string;
}

export interface AdminUpdateUserPayload {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  actorId?: string | null;
}
