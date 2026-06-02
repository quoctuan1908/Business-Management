import { isNumber } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import Activity from '@src/models/Activity.model';
import ActivityService from '@src/services/ActivityService';

import { Req, Res } from './common/express-types';
import parseReq from './common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const reqValidators = {
  add: parseReq({ activity: Activity.isCompleteWrite }),
  update: parseReq({ activity: Activity.isCompleteUpdate }),
  getOne: parseReq({ id: transform(Number, isNumber) }),
  delete: parseReq({ id: transform(Number, isNumber) }),
  confirm: parseReq({ id: transform(Number, isNumber) }),
  advance: parseReq({ id: transform(Number, isNumber) }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

async function getAll(_: Req, res: Res) {
  const activities = await ActivityService.getAll();
  res.status(HttpStatusCodes.OK).json({ activities });
}

async function getOne(req: Req, res: Res) {
  const { id } = reqValidators.getOne(req.params);
  const activity = await ActivityService.getOne(id);
  res.status(HttpStatusCodes.OK).json({ activity });
}

async function add(req: Req, res: Res) {
  const { activity } = reqValidators.add(req.body);
  const created = await ActivityService.addOne(activity);
  res.status(HttpStatusCodes.CREATED).json({ activity: created });
}

async function update(req: Req, res: Res) {
  const { activity } = reqValidators.update(req.body);
  const updated = await ActivityService.updateOne(activity.id, activity);
  res.status(HttpStatusCodes.OK).json({ activity: updated });
}

async function confirm(req: Req, res: Res) {
  const { id } = reqValidators.confirm(req.params);
  const result = await ActivityService.confirmOrder(id);
  res.status(HttpStatusCodes.OK).json(result);
}

async function advanceStatus(req: Req, res: Res) {
  const { id } = reqValidators.advance(req.params);
  const body = req.body ?? {};
  const pendingPayments = Array.isArray(body.pendingPayments)
    ? body.pendingPayments
    : undefined;
  const result = await ActivityService.advanceStatus(id, {
    pendingPayments,
    applyCustomerBalance: body.applyCustomerBalance,
  });
  res.status(HttpStatusCodes.OK).json(result);
}

async function delete_(req: Req, res: Res) {
  const { id } = reqValidators.delete(req.params);
  await ActivityService.delete(id);
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
  confirm,
  advanceStatus,
  delete: delete_,
} as const;
