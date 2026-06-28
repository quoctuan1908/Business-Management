import {
  isBoolean,
  isDate,
  isNonEmptyString,
  isNumber,
  isString,
  isUnsignedInteger,
} from 'jet-validators';
import { makeNullable, parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from './common/types';

const isNullableNumber = makeNullable(isNumber);

function isNullableApprovedAt(val: unknown): val is Date | null {
  if (val === null || val === undefined) return true;
  if (isDate(val)) return true;
  if (typeof val === 'string' || typeof val === 'number') {
    return !Number.isNaN(new Date(val).getTime());
  }
  return false;
}

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity customers
 */
export interface ICustomer extends Entity {
  locationId: number;
  companyName: string;
  businessType: string;
  representativeName: string;
  position: string;
  phoneNumber: string;
  currentBalance: number;
  lat: number | null;
  lng: number | null;
  isApproved: boolean;
  approvedAt: Date | null;
}

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): ICustomer => ({
  id: 0,
  locationId: 0,
  companyName: '',
  businessType: '',
  representativeName: '',
  position: '',
  phoneNumber: '',
  currentBalance: 0,
  lat: null,
  lng: null,
  isApproved: false,
  approvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema = {
  id: isUnsignedInteger,
  locationId: isUnsignedInteger,
  companyName: isString,
  businessType: isString,
  representativeName: isString,
  position: isString,
  phoneNumber: isString,
  currentBalance: isNumber,
  lat: isNullableNumber,
  lng: isNullableNumber,
  isApproved: isBoolean,
  approvedAt: isNullableApprovedAt,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
} satisfies Schema<ICustomer>;

/******************************************************************************
                                  Setup
******************************************************************************/

const parseCustomer = parseObject(schema);

const isCompleteCustomer = testObject<ICustomer>({
  ...schema,
  locationId: isUnsignedInteger,
  companyName: isNonEmptyString,
  businessType: isNonEmptyString,
  representativeName: isNonEmptyString,
  position: isNonEmptyString,
  phoneNumber: isNonEmptyString,
  currentBalance: isNumber,
  lat: isNumber,
  lng: isNumber,
  isApproved: isBoolean,
});

/******************************************************************************
                                 Functions
******************************************************************************/

function new_(customer?: Partial<ICustomer>): ICustomer {
  return parseCustomer({ ...GetDefaults(), ...customer }, (errors) => {
    throw new Error(
      'Setup new customer failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  new: new_,
  isComplete: isCompleteCustomer,
} as const;
