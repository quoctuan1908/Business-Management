import { isBoolean, isString, isUnsignedInteger } from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';
import { transformIsDate } from '@src/common/utils/validators';
import { AutoCreatePayload, createInsertValidator, Entity } from './common/types';

/******************************************************************************
                                   Constants
******************************************************************************/

const GetDefaults = (): IUser => ({
  id: 0,
  username: '',
  password: '',
  role: 'employee',
  fullName: '',
  department: '',
  phoneNumber: '',
  email: '',
  isActivated: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

const schema: Schema<IUser> = {
  id: isUnsignedInteger,
  username: isString,
  password: isString,
  role: isString,
  fullName: isString,
  department: isString,
  phoneNumber: isString,
  email: isString,
  isActivated: isBoolean,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
  deletedAt: (() => true) as any,
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
  isActivated: boolean;
  deletedAt: Date | null
}

export type IUserPublic = Omit<IUser, 'password'>;

export type IUserCreate = AutoCreatePayload<IUser>;

const newCreate = createInsertValidator<IUser, IUserCreate>(schema, 'Invalid User Registration');

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
  isActivated: isBoolean
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
  newCreate,
  isComplete: isCompleteUser,
  toPublic
} as const;
