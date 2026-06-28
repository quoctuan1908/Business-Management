import {
  isNonEmptyString,
  isString,
  isUnsignedInteger,
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from './common/types';

/**
 * @entity suppliers
 */
export interface ISupplier extends Entity {
  supplierName: string;
  businessType: string;
  address: string;
  phoneNumber: string;
  email: string;
}

const GetDefaults = (): ISupplier => ({
  id: 0,
  supplierName: '',
  businessType: '',
  address: '',
  phoneNumber: '',
  email: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema = {
  id: isUnsignedInteger,
  supplierName: isString,
  businessType: isString,
  address: isString,
  phoneNumber: isString,
  email: isString,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
} satisfies Schema<ISupplier>;

const parseSupplier = parseObject(schema);

const isCompleteSupplier = testObject<ISupplier>({
  ...schema,
  supplierName: isNonEmptyString,
  businessType: isNonEmptyString,
  address: isNonEmptyString,
  phoneNumber: isNonEmptyString,
  email: isNonEmptyString,
});

function new_(supplier?: Partial<ISupplier>): ISupplier {
  return parseSupplier({ ...GetDefaults(), ...supplier }, (errors) => {
    throw new Error(
      'Setup new supplier failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

export default {
  new: new_,
  isComplete: isCompleteSupplier,
} as const;
