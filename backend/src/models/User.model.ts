import { isString, isUnsignedInteger } from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';
import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from './common/types';

/******************************************************************************
                                   Constants
******************************************************************************/

const GetDefaults = (): IUser => ({
  id: 0,
  username: '',
  password: '',
  role: 'user',
  fullName: '',
  department: '',
  phoneNumber: '',
  email: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

const schema: Schema<Omit<IUser, 'createdAt' | 'updatedAt'>> = {
  id: isUnsignedInteger,
  username: isString,
  password: isString,
  role: isString,
  fullName: isString,
  department: isString,
  phoneNumber: isString,
  email: isString,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
  deletedAt: ((val: unknown) => (val === null ? null : transformIsDate(val))) as any,
};

/******************************************************************************
                                     Types
******************************************************************************/

/**
 * @entity users
 */
export interface IUser extends Entity {
  username: string;
  password: string;
  role: string;
  fullName: string;
  department: string;
  phoneNumber: string;
  email: string;

  deletedAt: Date | null
}

export type IUserPublic = Omit<IUser, 'password'>;

/******************************************************************************
                                     Setup
******************************************************************************/

const parseUser = parseObject<IUser>(schema);

const isCompleteUser = testObject<IUser>({
  ...schema,
  username: isString,
  password: isString,
  fullName: isString,
  email: isString,
});

/******************************************************************************
                                   Functions
******************************************************************************/

function new_(user?: Partial<IUser>): IUser {
  return parseUser({ ...GetDefaults(), ...user }, (errors) => {
    throw new Error('Setup new user failed ' + JSON.stringify(errors, null, 2));
  });
}

function toPublic(user: IUser): IUserPublic {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

/******************************************************************************
                                 Export default
******************************************************************************/

export default {
  new: new_,
  isComplete: isCompleteUser,
  toPublic
} as const;
