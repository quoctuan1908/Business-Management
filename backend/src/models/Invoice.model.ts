import { isNonEmptyString, isNumber, isString, isUnsignedInteger } from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';
import tspo from 'tspo';

import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from './common/types';

/******************************************************************************
                                 Constants
******************************************************************************/

export const InvoiceStatuses = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
} as const;

export type InvoiceStatus =
  (typeof InvoiceStatuses)[keyof typeof InvoiceStatuses];

const GetDefaults = (): IInvoice => ({
  id: 0,
  totalAmount: 0,
  date: new Date(),
  status: InvoiceStatuses.UNPAID,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<IInvoice> = {
  id: isUnsignedInteger,
  totalAmount: isNumber,
  date: transformIsDate,
  status: (v) => tspo.isValue(InvoiceStatuses, v),
};

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity invoices
 */
export interface IInvoice extends Entity {
  totalAmount: number;
  date: Date;
  status: InvoiceStatus;
}

/******************************************************************************
                                  Setup
******************************************************************************/

const parseInvoice = parseObject<IInvoice>(schema);

const isCompleteInvoice = testObject<IInvoice>({
  ...schema,
  totalAmount: isNumber,
  status: (v) => tspo.isValue(InvoiceStatuses, v),
});

/******************************************************************************
                                 Functions
******************************************************************************/

function new_(invoice?: Partial<IInvoice>): IInvoice {
  return parseInvoice({ ...GetDefaults(), ...invoice }, (errors) => {
    throw new Error(
      'Setup new invoice failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isComplete: isCompleteInvoice,
} as const;
