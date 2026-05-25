import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
<<<<<<< HEAD
import User, { IUser } from '@src/models/User.model';
=======
import { Errors } from '@src/models/common/types';
import { IUser } from '@src/models/User.model';
>>>>>>> main
import UserRepo from '@src/repos/UserRepo';


/******************************************************************************
                                Functions
******************************************************************************/

async function getAll() {
  const users = await UserRepo.getAll();
  return users.map(User.toPublic);
}

async function getOne(id: number) {
  const user = await UserRepo.getOne(id);
  if (!user) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return User.toPublic(user);
}

async function addOne(user: IUser) {
  const created = await UserRepo.add(user);
  return User.toPublic(created);
}

async function updateOne(user: IUser) {
  const exists = await UserRepo.persists(user.id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  const updated = await UserRepo.update(user);
  return User.toPublic(updated);
}

async function deleteOne(id: number): Promise<void> {
  const exists = await UserRepo.persists(id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.delete(id);
}

<<<<<<< HEAD
async function authenticate(username: string, passwordInput: string) {
  const user = await UserRepo.getOneByUsername(username);
  if (!user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
  }

  const isMatch = await UserRepo.comparePassword(passwordInput, user.password);
  if (!isMatch) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
  }

  return User.toPublic(user);
}

=======
>>>>>>> main
/******************************************************************************
                                Export default
******************************************************************************/

export default {
  Errors,
  getAll,
  getOne,
  addOne,
  updateOne,
<<<<<<< HEAD
  delete: deleteOne,
  authenticate,
=======
  delete: deleteOne
>>>>>>> main
} as const;
