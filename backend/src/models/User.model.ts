import { isNonEmptyString, isString, isUnsignedInteger } from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { Entity } from './common/types';

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): IUser => ({
  id: 0,
  username: '',
  password: '',
  role: 'user',
  fullname: '',
  department: '',
  phoneNumber: '',
  email: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<Omit<IUser, 'createdAt' | 'updatedAt'>> = {
  id: isUnsignedInteger,
  username: isString,
  password: isString,
  role: isString,
  fullname: isString,
  department: isString,
  phoneNumber: isString,
  email: isString,
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
  fullname: string;
  department: string;
  phoneNumber: string;
  email: string;
}

export type IUserPublic = Omit<IUser, 'password'>;

/******************************************************************************
                                  Setup
******************************************************************************/

const parseUser = parseObject<IUser>(schema);

const isCompleteUser = testObject<Omit<IUser, 'createdAt' | 'updatedAt'>>({
  ...schema,
  username: isNonEmptyString,
  password: isNonEmptyString,
  role: isNonEmptyString,
  fullname: isNonEmptyString,
  department: isNonEmptyString,
  phoneNumber: isNonEmptyString,
  email: isNonEmptyString,
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
  toPublic,
} as const;
