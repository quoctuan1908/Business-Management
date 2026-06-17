import {
  isNonEmptyString,
  isNumber,
  isString,
  isUnsignedInteger,
  isBoolean, 
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { Entity } from './common/types';

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

const schema: Schema<ICustomer> = {
  id: isUnsignedInteger,
  locationId: isUnsignedInteger,
  companyName: isString,
  businessType: isString,
  representativeName: isString,
  position: isString,
  phoneNumber: isString,
  currentBalance: isNumber,
  lat: (val: unknown) => val === null || isNumber(val),
  lng: (val: unknown) => val === null || isNumber(val),
  isApproved: isBoolean,
};

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
  approvedAt: Date | string | null;
}

/******************************************************************************
                                  Setup
******************************************************************************/

const parseCustomer = parseObject<ICustomer>(schema);

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