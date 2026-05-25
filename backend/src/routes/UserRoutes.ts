import { isNonEmptyString, isNumber } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import User from '@src/models/User.model';
import UserService from '@src/services/UserService';

import { Req, Res } from './common/express-types';
import parseReq from './common/parseReq';


/******************************************************************************
                                Constants
******************************************************************************/

const reqValidators = {
  add: parseReq({ user: User.isComplete }),
  update: parseReq({ user: User.isComplete }),
  getOne: parseReq({ id: transform(Number, isNumber) }),
  delete: parseReq({ id: transform(Number, isNumber) }),
  authenticate: parseReq({
    username: isNonEmptyString,
    password: isNonEmptyString,
  }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

async function getAll(_: Req, res: Res) {
  const users = await UserService.getAll();
  res.status(HttpStatusCodes.OK).json({ users });
}

async function getOne(req: Req, res: Res) {
  const { id } = reqValidators.getOne(req.params);
  const user = await UserService.getOne(id);
  res.status(HttpStatusCodes.OK).json({ user });
}

async function add(req: Req, res: Res) {
  const { user } = reqValidators.add(req.body);
  const created = await UserService.addOne(user);
  res.status(HttpStatusCodes.CREATED).json({ user: created });
}

async function update(req: Req, res: Res) {
  const { user } = reqValidators.update(req.body);
  const updated = await UserService.updateOne(user);
  res.status(HttpStatusCodes.OK).json({ user: updated });
}

async function delete_(req: Req, res: Res) {
  const { id } = reqValidators.delete(req.params);
  await UserService.delete(id);
  res.status(HttpStatusCodes.OK).end();
}

<<<<<<< HEAD
async function login(req: Req, res: Res) {
  const { username, password } = reqValidators.authenticate(req.body);
  const user = await UserService.authenticate(username, password);
  res.status(HttpStatusCodes.OK).json({ user });
}

=======
>>>>>>> main
/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getAll,
  getOne,
  add,
  update,
<<<<<<< HEAD
  delete: delete_,
  login,
=======
  delete: delete_
>>>>>>> main
} as const;
