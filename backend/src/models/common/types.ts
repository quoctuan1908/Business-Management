export interface Entity {
  id: number; // @PK
<<<<<<< HEAD
  createdAt: Date;
  updatedAt: Date;
=======
  created: Date; // @audit
>>>>>>> main
}

export interface ISessionUser {
  user_id: number;
  username: string;
  role: string;
}

export const Errors = {
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid username or password',
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true, 
  secure: true, 
  sameSite: 'strict' as const, 
  path: '/',
};