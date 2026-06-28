import { isNonEmptyString, isNumber, isString, isUnsignedInteger } from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from './common/types';

/**
 * @entity products
 */
export interface IProduct extends Entity {
  productName: string;
  unitPrice: number;
  stockQuantity: number;
}

const GetDefaults = (): IProduct => ({
  id: 0,
  productName: '',
  unitPrice: 0,
  stockQuantity: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema = {
  id: isUnsignedInteger,
  productName: isString,
  unitPrice: isNumber,
  stockQuantity: isUnsignedInteger,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
} satisfies Schema<IProduct>;

const parseProduct = parseObject(schema);

const isCompleteProduct = testObject<IProduct>({
  ...schema,
  productName: isNonEmptyString,
  unitPrice: isNumber,
  stockQuantity: isUnsignedInteger,
});

function new_(product?: Partial<IProduct>): IProduct {
  return parseProduct({ ...GetDefaults(), ...product }, (errors) => {
    throw new Error(
      'Setup new product failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

export default {
  new: new_,
  isComplete: isCompleteProduct,
} as const;
