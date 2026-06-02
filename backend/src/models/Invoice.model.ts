import { isNumber, isUnsignedInteger } from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from './common/types';

const GetDefaults = (): IInvoice => ({
  id: 0,
  totalAmount: 0,
  date: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<IInvoice> = {
  id: isUnsignedInteger,
  totalAmount: isNumber,
  date: transformIsDate,
};

/**
 * @entity invoices
 */
export interface IInvoice extends Entity {
  totalAmount: number;
  date: Date;
}

const parseInvoice = parseObject<IInvoice>(schema);

const isCompleteInvoice = testObject<IInvoice>({
  ...schema,
  totalAmount: isNumber,
});

function new_(invoice?: Partial<IInvoice>): IInvoice {
  return parseInvoice({ ...GetDefaults(), ...invoice }, (errors) => {
    throw new Error(
      'Setup new invoice failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

export default {
  new: new_,
  isComplete: isCompleteInvoice,
} as const;
