import { isString, isUnsignedInteger } from 'jet-validators';
import { parseObject, Schema, testObject } from 'jet-validators/utils';
import { transformIsDate } from '@src/common/utils/validators';
import { AutoCreatePayload, Entity } from './common/types';

/******************************************************************************
                                   Constants
******************************************************************************/

const GetDefaults = (): IBankAccount => ({
  id: 0,
  userId: 0,
  bankName: '',
  accountNumber: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const schema: Schema<IBankAccount> = {
  id: isUnsignedInteger,
  userId: isUnsignedInteger,
  bankName: isString,
  accountNumber: isString,
  createdAt: transformIsDate,
  updatedAt: transformIsDate,
};

const bankAccountCreateSchema: Schema<IBankAccountCreate> = {
  userId: isUnsignedInteger,
  bankName: isString,
  accountNumber: isString,
};

/******************************************************************************
                                     Types
******************************************************************************/

/**
 * @entity bank_accounts
 */
export interface IBankAccount extends Entity {
  userId: number;
  bankName: string;
  accountNumber: string;
}

export type IBankAccountCreate = AutoCreatePayload<IBankAccount>;

const parseBankAccountCreate = parseObject<IBankAccountCreate>(bankAccountCreateSchema);

/******************************************************************************
                                     Setup
******************************************************************************/

const parseBankAccount = parseObject<IBankAccount>(schema);

const isCompleteBankAccount = testObject<IBankAccount>({
  ...schema,
  userId: isUnsignedInteger,
  bankName: isString,
  accountNumber: isString,
});

/******************************************************************************
                                   Functions
******************************************************************************/

function newCreate(payload: unknown): IBankAccountCreate {
  return parseBankAccountCreate(payload, (errors) => {
    throw new Error(`Invalid Bank Account Registration: ${JSON.stringify(errors)}`);
  });
}

function new_(bankAccount?: Partial<IBankAccount>): IBankAccount {
  return parseBankAccount({ ...GetDefaults(), ...bankAccount }, (errors) => {
    throw new Error('Setup new bank account failed ' + JSON.stringify(errors, null, 2));
  });
}

/**
 * Map Prisma row (snake_case) to Model (camelCase)
 */
function mapRowToBankAccount(row: {
  bank_account_id: number;
  user_id: number;
  bank_name: string;
  account_number: string;
  created_at: Date;
  updated_at: Date;
}): IBankAccount {
  return {
    id: row.bank_account_id,
    userId: row.user_id,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/******************************************************************************
                                   Export default
******************************************************************************/

export default {
  new: new_,
  newCreate,
  isComplete: isCompleteBankAccount,
  mapRow: mapRowToBankAccount,
} as const;