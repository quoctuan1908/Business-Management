import { isNonEmptyString, isString, isUnsignedInteger } from 'jet-validators';
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
  created: new Date(),
});

const schema: Schema<IUser> = {
  id: isUnsignedInteger,
  username: isString,
  password: isString,
  role: isString,
  created: transformIsDate,
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
  role:string;
}

/******************************************************************************
                                  Setup
******************************************************************************/

// Set the "parseUser" function
const parseUser = parseObject<IUser>(schema);

// For the APIs make sure the right fields are complete
const isCompleteUser = testObject<IUser>({
  ...schema,
  username: isNonEmptyString,
  password: isNonEmptyString,
  role: isNonEmptyString
});

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * New user object.
 */
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
