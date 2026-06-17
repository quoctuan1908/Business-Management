import { isNumber } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import Customer from '@src/models/Customer.model';
import CustomerService from '@src/services/CustomerService';

import { Req, Res } from './common/express-types';
import parseReq from './common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const reqValidators = {
  add: parseReq({ customer: Customer.isComplete }),
  update: parseReq({ customer: Customer.isComplete }),
  getOne: parseReq({ id: transform(Number, isNumber) }),
  delete: parseReq({ id: transform(Number, isNumber) }),
  customerId: parseReq({ id: transform(Number, isNumber) }),
  approve: parseReq({ id: transform(Number, isNumber) }),
} as const;

function parseReceivePaymentBody(body: unknown): { amount: number; method: string } {
  const raw =
    typeof body === 'object' && body !== null && 'payment' in body
      ? (body as { payment: { amount?: number; method?: string } }).payment
      : (body as { amount?: number; method?: string });
  const amount = Number(raw?.amount);
  const method = typeof raw?.method === 'string' ? raw.method.trim() : '';
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, CustomerService.Errors.INVALID_AMOUNT);
  }
  if (!method) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, CustomerService.Errors.INVALID_METHOD);
  }
  return { amount, method };
}

/******************************************************************************
                                Functions
******************************************************************************/

async function getAll(_: Req, res: Res) {
  const customers = await CustomerService.getAll();
  res.status(HttpStatusCodes.OK).json({ customers });
}

async function getOne(req: Req, res: Res) {
  const { id } = reqValidators.getOne(req.params);
  const customer = await CustomerService.getOne(id);
  res.status(HttpStatusCodes.OK).json({ customer });
}

async function add(req: Req, res: Res) {
  const { customer } = reqValidators.add(req.body);
  const created = await CustomerService.addOne(customer);
  res.status(HttpStatusCodes.CREATED).json({ customer: created });
}

async function update(req: Req, res: Res) {
  const { customer } = reqValidators.update(req.body);
  const updated = await CustomerService.updateOne(customer);
  res.status(HttpStatusCodes.OK).json({ customer: updated });
}

async function delete_(req: Req, res: Res) {
  const { id } = reqValidators.delete(req.params);
  await CustomerService.delete(id);
  res.status(HttpStatusCodes.OK).end();
}

async function getAccount(req: Req, res: Res) {
  const { id } = reqValidators.customerId(req.params);
  const account = await CustomerService.getAccount(id);
  res.status(HttpStatusCodes.OK).json({ account });
}

async function receivePayment(req: Req, res: Res) {
  const { id } = reqValidators.customerId(req.params);
  const input = parseReceivePaymentBody(req.body);
  const result = await CustomerService.receivePayment(id, input);
  res.status(HttpStatusCodes.OK).json(result);
}

async function getPendingApproval(_: Req, res: Res) {
  const customers = await CustomerService.getPendingApproval();
  res.status(HttpStatusCodes.OK).json({ customers });
}

async function approve(req: Req, res: Res) {
  const { id } = reqValidators.approve(req.params);
  const updated = await CustomerService.approveCustomer(id);
  res.status(HttpStatusCodes.OK).json({ customer: updated });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getAll,
  getOne,
  add,
  update,
  delete: delete_,
  getAccount,
  receivePayment,
  getPendingApproval,
  approve,
} as const;