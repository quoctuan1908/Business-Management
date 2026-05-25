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
  full_name: '',
  department: '',
  phone_number: '',
  email: '',
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
});

const schema: Schema<IUser> = {
  id: isUnsignedInteger,
  username: isString,
  password: isString,
  role: isString,
  full_name: isString,
  department: isString,
  phone_number: isString,
  email: isString,
  created_at: transformIsDate,
  updated_at: transformIsDate,
  deleted_at: ((val: unknown) => (val === null ? null : transformIsDate(val))) as any,
};

/******************************************************************************
                                     Types
******************************************************************************/

/**
 * @entity users
 */
export interface IUser extends Entity {
  id: number;
  username: string;
  password: string;
  role: string;
  full_name: string;
  department: string;
  phone_number: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/******************************************************************************
                                     Setup
******************************************************************************/

const parseUser = parseObject<IUser>(schema);

const isCompleteUser = testObject<IUser>({
  ...schema,
  username: isString,
  password: isString,
  full_name: isString,
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

/******************************************************************************
                                 Export default
******************************************************************************/

export default {
  new: new_,
  isComplete: isCompleteUser,
} as const;