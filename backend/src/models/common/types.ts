import { parseObject, Schema } from 'jet-validators/utils';

export interface Entity {
  id: number; // @PK
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionUser {
  userId: number;
  username: string;
  role: string;
}

export { AuthErrors as Errors } from '@src/common/constants/service-errors';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
};

export type AutoCreatePayload<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
