import { isNumber } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import Import from '@src/models/Import.model';
import ImportService from '@src/services/ImportService';

import { Req, Res } from './common/express-types';
import parseReq from './common/parseReq';

const reqValidators = {
  add: parseReq({ import: Import.isCompleteWrite }),
  update: parseReq({ import: Import.isCompleteWrite }),
  getOne: parseReq({ id: transform(Number, isNumber) }),
  delete: parseReq({ id: transform(Number, isNumber) }),
} as const;

async function getAll(_: Req, res: Res) {
  const imports = await ImportService.getAll();
  res.status(HttpStatusCodes.OK).json({ imports });
}

async function getOne(req: Req, res: Res) {
  const { id } = reqValidators.getOne(req.params);
  const record = await ImportService.getOne(id);
  res.status(HttpStatusCodes.OK).json({ import: record });
}

async function add(req: Req, res: Res) {
  const { import: importRecord } = reqValidators.add(req.body);
  const created = await ImportService.addOne(importRecord);
  res.status(HttpStatusCodes.CREATED).json({ import: created });
}

async function update(req: Req, res: Res) {
  const { id } = reqValidators.getOne(req.params);
  const { import: importRecord } = reqValidators.update(req.body);
  const updated = await ImportService.updateOne(id, importRecord);
  res.status(HttpStatusCodes.OK).json({ import: updated });
}

async function delete_(req: Req, res: Res) {
  const { id } = reqValidators.delete(req.params);
  await ImportService.deleteWithStockRollback(id);
  res.status(HttpStatusCodes.OK).end();
}

export default {
  getAll,
  getOne,
  add,
  update,
  delete: delete_,
} as const;
