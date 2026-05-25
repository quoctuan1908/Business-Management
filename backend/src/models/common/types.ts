export interface Entity {
  id: number; // @PK
  createdAt: Date; // @audit
  updatedAt: Date;
}

export interface ISessionUser {
  userId: number;
  username: string;
  role: string;
}

export const Errors = {
  USER_NOT_FOUND: 'User not found',
  EMPLOYEE_NOT_FOUND: 'Employee not found',
  INVALID_CREDENTIALS: 'Invalid username or password',
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true, 
  secure: true, 
  sameSite: 'strict' as const, 
  path: '/',
};