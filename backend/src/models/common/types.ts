import { parseObject, Schema } from 'jet-validators/utils';

export interface Entity {
  id: number; // @PK
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionUser {
  id: number;
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

export type AutoCreatePayload<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

/**
 * Hàm tự động sinh ra bộ Validator cho luồng Tạo mới từ Schema gốc
 */
export function createInsertValidator<TEntity, TCreateDto>(
  baseSchema: Schema<TEntity>,
  errorPrefix = 'Validation failed'
) {
  const createSchema = { ...baseSchema } as any;

  delete createSchema.id;
  delete createSchema.createdAt;
  delete createSchema.updatedAt;
  delete createSchema.deletedAt;

  const parser = parseObject<TCreateDto>(createSchema);

  return (payload: unknown): TCreateDto => {
    return parser(payload, (errors) => {
      throw new Error(`${errorPrefix}: ${JSON.stringify(errors)}`);
    });
  };
}
