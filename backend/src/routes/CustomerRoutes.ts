import { isNumber } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
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
} as const;

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

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getAll,
  getOne,
  add,
  update,
  delete: delete_,
} as const;
