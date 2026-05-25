import { isNonEmptyString, isNumber, isString, isUnsignedInteger } from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { Entity } from './common/types';

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): IProduct => ({
  id: 0,
  productName: '',
  unitPrice: 0,
  stockQuantity: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<IProduct> = {
  id: isUnsignedInteger,
  productName: isString,
  unitPrice: isNumber,
  stockQuantity: isUnsignedInteger,
};

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity products
 */
export interface IProduct extends Entity {
  productName: string;
  unitPrice: number;
  stockQuantity: number;
}

/******************************************************************************
                                  Setup
******************************************************************************/

const parseProduct = parseObject<IProduct>(schema);

const isCompleteProduct = testObject<IProduct>({
  ...schema,
  productName: isNonEmptyString,
  unitPrice: isNumber,
  stockQuantity: isUnsignedInteger,
});

/******************************************************************************
                                 Functions
******************************************************************************/

function new_(product?: Partial<IProduct>): IProduct {
  return parseProduct({ ...GetDefaults(), ...product }, (errors) => {
    throw new Error(
      'Setup new product failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isComplete: isCompleteProduct,
} as const;
