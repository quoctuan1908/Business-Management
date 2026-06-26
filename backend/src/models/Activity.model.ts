import { isNonEmptyString, isString, isUnsignedInteger } from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';
import tspo from 'tspo';

import { PaymentStatuses, type PaymentStatusCode } from '@src/common/constants/payment-status';
import { transformIsDate } from '@src/common/utils/validators';
import { Entity } from './common/types';

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): IActivity => ({
  id: 0,
  userId: 0,
  customerId: 0,
  invoiceId: null,
  status: 'draft',
  paymentStatus: PaymentStatuses.UNPAID,
  activityDate: new Date(),
  deliveryDate: null,
  content: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<IActivity> = {
  id: isUnsignedInteger,
  userId: isUnsignedInteger,
  customerId: isUnsignedInteger,
  status: isString,
  paymentStatus: (v) => tspo.isValue(PaymentStatuses, v),
  activityDate: transformIsDate,
  deliveryDate: (v) => v === null || v === undefined || transformIsDate(v),
  content: isString,
};

const writeSchema: Schema<IActivityWrite> = {
  userId: isUnsignedInteger,
  customerId: isUnsignedInteger,
  content: isString,
};

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity activities
 */
export interface IActivity extends Entity {
  userId: number;
  customerId: number;
  invoiceId: number | null;
  status: string;
  paymentStatus: PaymentStatusCode;
  activityDate: Date;
  deliveryDate: Date | null;
  content: string;
}

/** Bổ sung thông tin thanh toán khi liệt kê hoạt động. */
export interface IActivityListItem extends IActivity {
  invoiceTotal: number;
  paidTotal: number;
  remaining: number;
  paymentStatusLabel: string;
}

export interface IActivityWrite {
  userId: number;
  customerId: number;
  content: string;
}

export interface IActivityUpdate extends IActivityWrite {
  id: number;
}

/******************************************************************************
                                  Setup
******************************************************************************/

const parseActivity = parseObject<IActivity>(schema);

const isCompleteActivityWrite = testObject<IActivityWrite>({
  ...writeSchema,
  userId: isUnsignedInteger,
  customerId: isUnsignedInteger,
  content: isNonEmptyString,
});

const isCompleteActivityUpdate = testObject<IActivityUpdate>({
  id: isUnsignedInteger,
  userId: isUnsignedInteger,
  customerId: isUnsignedInteger,
  content: isNonEmptyString,
});

/******************************************************************************
                                 Functions
******************************************************************************/

function new_(activity?: Partial<IActivity>): IActivity {
  return parseActivity({ ...GetDefaults(), ...activity }, (errors) => {
    throw new Error(
      'Setup new activity failed ' + JSON.stringify(errors, null, 2),
    );
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  new: new_,
  isCompleteWrite: isCompleteActivityWrite,
  isCompleteUpdate: isCompleteActivityUpdate,
} as const;
