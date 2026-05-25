import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import User, { IUser } from '@src/models/User.model';
import { IUser, IUserPublic } from '@src/models/User.model';
import UserRepo from '@src/repos/UserRepo';


/******************************************************************************
                                   Functions
******************************************************************************/

/**
 * Get all users.
 */
function getAll(): Promise<IUserPublic[]> {
  return UserRepo.getAll();
}

/**
 * Search users by query string.
 */
function search(query: string): Promise<IUserPublic[]> {
  return UserRepo.search(query);
}

/**
 * Add one user.
 */
function addOne(user: IUser): Promise<IUserPublic> {
  return UserRepo.add(user);
}

/**
 * Update one user.
 */
async function updateOne(user: IUser): Promise<IUserPublic> {
  const persists = await UserRepo.persists(user.id);
  if (!persists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  const updated = await UserRepo.update(user);
  return updated;
}

async function deleteOne(id: number): Promise<void> {
  const exists = await UserRepo.persists(id);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return UserRepo.delete(id);
}

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

/******************************************************************************
                                 Export default
******************************************************************************/

export default {
  getAll,
  search,
  addOne,
  updateOne,
  delete: deleteOne,
} as const;
