import {
  isNonEmptyString,
  isString,
  isUnsignedInteger,
} from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { Entity } from './common/types';

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

const schema: Schema<ISupplier> = {
  id: isUnsignedInteger,
  supplierName: isString,
  businessType: isString,
  address: isString,
  phoneNumber: isString,
  email: isString,
};

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

const parseSupplier = parseObject<ISupplier>(schema);

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
