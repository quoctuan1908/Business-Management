import { isNonEmptyString, isNumber, isString } from 'jet-validators';
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
  search: parseReq({ query: isString }),
  authenticate: parseReq({ 
    username: isNonEmptyString, 
    password: isNonEmptyString 
  }),
} as const;

/******************************************************************************
                                   Functions
******************************************************************************/

/**
 * Get all users.
 * @route GET /api/users/all
 */
async function getAll(_: Req, res: Res) {
  const users = await UserService.getAll();
  res.status(HttpStatusCodes.OK).json({ users });
}

/**
 * Search users by full_name, username, department, email, or phone_number.
 * @route GET /api/users/search?query=...
 */
async function search(req: Req, res: Res) {
  const { query } = reqValidators.search(req.query);
  const users = await UserService.search(query);
  res.status(HttpStatusCodes.OK).json({ users });
}

/**
 * Add one user.
 * @route POST /api/users/add
 */
async function add(req: Req, res: Res) {
  const { user } = reqValidators.add(req.body);
  const created = await UserService.addOne(user);
  res.status(HttpStatusCodes.CREATED).json({ user: created });
}

/**
 * Update one user.
 * @route PUT /api/users/update
 */
async function update(req: Req, res: Res) {
  const { user } = reqValidators.update(req.body);
  const updated = await UserService.updateOne(user);
  res.status(HttpStatusCodes.OK).json({ user: updated });
}

/**
 * Delete one user (Soft delete).
 * @route DELETE /api/users/delete/:id
 */
async function delete_(req: Req, res: Res) {
  const { id } = reqValidators.delete(req.params);
  await UserService.delete(id);
  res.status(HttpStatusCodes.OK).end();
}

/******************************************************************************
                                 Export default
******************************************************************************/

export default {
  getAll,
  search,
  add,
  update,
  delete: delete_,
} as const;

